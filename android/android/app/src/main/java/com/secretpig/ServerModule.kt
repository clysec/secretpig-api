package com.secretpig

import android.util.Log
import com.facebook.react.bridge.*
import java.io.File

private const val TAG = "SecretPigServer"
private const val BINARY_NAME = "libsecretpig.so"

class ServerModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var serverProcess: Process? = null

    override fun getName(): String = "ServerModule"

    /**
     * Return the binary installed by the package manager into the native library dir.
     * That directory is exec-mounted, unlike filesDir which is noexec on Android 10+.
     */
    private fun getBinary(): File {
        val nativeLibDir = reactContext.applicationInfo.nativeLibraryDir
        return File(nativeLibDir, BINARY_NAME)
    }

    @ReactMethod
    fun start(port: Int, promise: Promise) {
        if (serverProcess?.isAlive == true) {
            promise.resolve("already_running")
            return
        }
        try {
            val binary = getBinary()
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
