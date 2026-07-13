package com.stampy.app

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.os.SystemClock
import android.view.Surface
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.EventChannel
import kotlin.math.PI
import kotlin.math.abs

class MainActivity : FlutterActivity(), EventChannel.StreamHandler, SensorEventListener {
    private var headingChannel: EventChannel? = null
    private var headingSink: EventChannel.EventSink? = null
    private var sensorManager: SensorManager? = null
    private var rotationVectorSensor: Sensor? = null
    private var lastEmittedHeading: Double? = null
    private var lastEmissionNanos = 0L
    private var reportedUnreliable = false

    private val rotationMatrix = FloatArray(9)
    private val remappedRotationMatrix = FloatArray(9)
    private val orientation = FloatArray(3)

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        sensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager
        rotationVectorSensor = sensorManager?.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR)
        headingChannel = EventChannel(flutterEngine.dartExecutor.binaryMessenger, HEADING_CHANNEL).also {
            it.setStreamHandler(this)
        }
    }

    override fun cleanUpFlutterEngine(flutterEngine: FlutterEngine) {
        stopHeadingUpdates()
        headingChannel?.setStreamHandler(null)
        headingChannel = null
        sensorManager = null
        rotationVectorSensor = null
        super.cleanUpFlutterEngine(flutterEngine)
    }

    override fun onListen(arguments: Any?, events: EventChannel.EventSink) {
        stopHeadingUpdates()
        headingSink = events
        reportedUnreliable = false

        val manager = sensorManager
        val sensor = rotationVectorSensor
        if (manager == null || sensor == null) {
            finishUnavailable(events)
            return
        }

        if (!manager.registerListener(this, sensor, SENSOR_DELAY_MICROSECONDS)) {
            finishUnavailable(events)
        }
    }

    override fun onCancel(arguments: Any?) {
        stopHeadingUpdates()
    }

    override fun onSensorChanged(event: SensorEvent) {
        if (event.sensor.type != Sensor.TYPE_ROTATION_VECTOR) return
        if (event.accuracy == SensorManager.SENSOR_STATUS_UNRELIABLE) {
            emitUnreliableHeading()
            return
        }
        reportedUnreliable = false

        SensorManager.getRotationMatrixFromVector(rotationMatrix, event.values)
        val displayRotation = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            display?.rotation ?: Surface.ROTATION_0
        } else {
            @Suppress("DEPRECATION")
            windowManager.defaultDisplay.rotation
        }
        val matrix = when (displayRotation) {
            Surface.ROTATION_90 -> remap(SensorManager.AXIS_Y, SensorManager.AXIS_MINUS_X)
            Surface.ROTATION_180 -> remap(SensorManager.AXIS_MINUS_X, SensorManager.AXIS_MINUS_Y)
            Surface.ROTATION_270 -> remap(SensorManager.AXIS_MINUS_Y, SensorManager.AXIS_X)
            else -> rotationMatrix
        }

        SensorManager.getOrientation(matrix, orientation)
        val degrees = orientation[0].toDouble() * 180.0 / PI
        val normalized = ((degrees % 360.0) + 360.0) % 360.0
        if (!normalized.isFinite() || !shouldEmit(normalized)) return

        lastEmittedHeading = normalized
        lastEmissionNanos = SystemClock.elapsedRealtimeNanos()
        headingSink?.success(normalized)
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
        if (sensor?.type == Sensor.TYPE_ROTATION_VECTOR &&
            accuracy == SensorManager.SENSOR_STATUS_UNRELIABLE
        ) {
            emitUnreliableHeading()
        }
    }

    private fun shouldEmit(heading: Double): Boolean {
        val previous = lastEmittedHeading ?: return true
        val elapsed = SystemClock.elapsedRealtimeNanos() - lastEmissionNanos
        val delta = abs(((heading - previous + 540.0) % 360.0) - 180.0)
        return elapsed >= MIN_EMISSION_INTERVAL_NANOS &&
            delta >= MIN_HEADING_DELTA_DEGREES
    }

    private fun emitUnreliableHeading() {
        if (reportedUnreliable) return
        reportedUnreliable = true
        lastEmittedHeading = null
        lastEmissionNanos = 0L
        headingSink?.success(null)
    }

    private fun remap(axisX: Int, axisY: Int): FloatArray {
        return if (SensorManager.remapCoordinateSystem(
                rotationMatrix,
                axisX,
                axisY,
                remappedRotationMatrix,
            )
        ) {
            remappedRotationMatrix
        } else {
            rotationMatrix
        }
    }

    private fun finishUnavailable(events: EventChannel.EventSink) {
        events.success(null)
        events.endOfStream()
        if (headingSink === events) headingSink = null
    }

    private fun stopHeadingUpdates() {
        sensorManager?.unregisterListener(this)
        headingSink = null
        lastEmittedHeading = null
        lastEmissionNanos = 0L
        reportedUnreliable = false
    }

    private companion object {
        const val HEADING_CHANNEL = "stampy/heading"
        const val SENSOR_DELAY_MICROSECONDS = 100_000
        const val MIN_EMISSION_INTERVAL_NANOS = 100_000_000L
        const val MIN_HEADING_DELTA_DEGREES = 3.0
    }
}
