package com.secretpig

import android.util.Log
import com.facebook.react.bridge.*
import java.io.File
import java.io.FileOutputStream

private const val TAG = "SecretPigServer"
private const val BINARY_NAME = "secretpig"

class ServerModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var serverProcess: Process? = null

    override fun getName(): String = "ServerModule"

    /** Extract the bundled binary from assets to the app's private files dir if needed. */
    private fun extractBinary(): File {
        val dest = File(reactContext.filesDir, BINARY_NAME)
        if (dest.exists() && dest.canExecute()) return dest
        reactContext.assets.open(BINARY_NAME).use { input ->
            FileOutputStream(dest).use { output -> input.copyTo(output) }
        }
        dest.setExecutable(true, true)
        return dest
    }

    @ReactMethod
    fun start(port: Int, promise: Promise) {
        if (serverProcess?.isAlive == true) {
            promise.resolve("already_running")
            return
        }
        try {
            val binary = extractBinary()
            val env = mapOf(
                "PORT" to port.toString(),
                "GIN_MODE" to "release",
                "HOME" to reactContext.filesDir.absolutePath,
            )
            serverProcess = ProcessBuilder(binary.absolutePath)
                .directory(reactContext.filesDir)
                .also { pb -> pb.environment().putAll(env) }
                .redirectErrorStream(true)
                .start()

            // Drain stdout/stderr to logcat so the binary doesn't block on a full pipe.
            val proc = serverProcess!!
            Thread {
                proc.inputStream.bufferedReader().forEachLine { Log.d(TAG, it) }
            }.also { it.isDaemon = true }.start()

            // Give the server ~500 ms to fail fast (port conflict, bad binary, etc.)
            Thread.sleep(500)
            if (!proc.isAlive) {
                val exitCode = proc.exitValue()
                serverProcess = null
                promise.reject("SERVER_DIED", "Process exited immediately with code $exitCode")
                return
            }

            promise.resolve("started")
        } catch (e: Exception) {
            serverProcess = null
            promise.reject("START_FAILED", e.message, e)
        }
    }

    @ReactMethod
    fun stop(promise: Promise) {
        serverProcess?.let {
            it.destroy()
            it.waitFor()
            serverProcess = null
        }
        promise.resolve(null)
    }

    @ReactMethod
    fun isRunning(promise: Promise) {
        promise.resolve(serverProcess?.isAlive == true)
    }

    override fun invalidate() {
        serverProcess?.destroy()
        serverProcess = null
        super.invalidate()
    }
}
