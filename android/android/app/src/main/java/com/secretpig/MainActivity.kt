package com.secretpig

import android.content.Intent
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

    override fun getMainComponentName(): String = "SecretPig"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

    override fun onStart() {
        super.onStart()
        handleIntent(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent?) {
        if (intent == null) return
        val url = when (intent.action) {
            Intent.ACTION_SEND -> {
                if (intent.type?.startsWith("text/") == true)
                    intent.getStringExtra(Intent.EXTRA_TEXT)
                else null
            }
            Intent.ACTION_VIEW -> intent.dataString
            else -> null
        } ?: return

        // Trim and only forward if it looks like a URL or path
        val trimmed = url.trim()
        if (trimmed.isEmpty()) return

        val reactHost = (application as? MainApplication)?.reactHost ?: return
        val shareModule = reactHost.currentReactContext
            ?.getNativeModule(ShareIntentModule::class.java)
        if (shareModule != null) {
            shareModule.onSharedUrl(trimmed)
        } else {
            // App not yet initialised — store for JS to pick up on mount
            ShareIntentModule.pendingUrl = trimmed
        }
    }
}
