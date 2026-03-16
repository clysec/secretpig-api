package com.secretpig

import android.content.Intent
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class ShareIntentModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "ShareIntentModule"

    /** Called from MainActivity to hand off a shared URL. */
    fun onSharedUrl(url: String) {
        if (reactContext.hasActiveReactInstance()) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("SharedUrl", url)
        } else {
            pendingUrl = url
        }
    }

    /** JS can pull the URL that was pending when the app first launched. */
    @ReactMethod
    fun getPendingUrl(promise: Promise) {
        promise.resolve(pendingUrl)
        pendingUrl = null
    }

    companion object {
        var pendingUrl: String? = null
    }
}
