package com.ashenvow.rpg;

import static org.junit.Assert.*;

import android.content.Context;
import android.content.pm.PackageManager;
import android.widget.FrameLayout;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import com.google.android.gms.ads.AdListener;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.Test;
import org.junit.runner.RunWith;

/** Live SDK smoke test against Google's public demo units; never performs a purchase. */
@RunWith(AndroidJUnit4.class)
public class MonetizationIntegrationTest {
    @Test public void nativePluginsAndBundledGameAreAvailable() throws Exception {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        String appId = context.getPackageManager().getApplicationInfo(context.getPackageName(), PackageManager.GET_META_DATA)
            .metaData.getString("com.google.android.gms.ads.APPLICATION_ID");
        assertEquals("ca-app-pub-3940256099942544~3347511713", appId);
        try (var file = context.getAssets().open("public/audio/town-stonewater.mp3")) {
            assertTrue(file.available() > 1_000_000);
        }
        try (var scenario = ActivityScenario.launch(MainActivity.class)) {
            scenario.onActivity(activity -> {
                assertNotNull(activity.getBridge().getPlugin("AdMob"));
                assertNotNull(activity.getBridge().getPlugin("NativePurchases"));
                assertNotNull(activity.getBridge().getWebView());
            });
        }
    }

    @Test public void allThreeGoogleTestAdFormatsLoad() throws Exception {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        CountDownLatch initialized = new CountDownLatch(1);
        MobileAds.initialize(context, status -> initialized.countDown());
        assertTrue("Ad SDK initialization timed out", initialized.await(30, TimeUnit.SECONDS));
        CountDownLatch loaded = new CountDownLatch(3);
        AtomicReference<String> failure = new AtomicReference<>();
        AtomicReference<AdView> banner = new AtomicReference<>();
        try (var scenario = ActivityScenario.launch(MainActivity.class)) {
            scenario.onActivity(activity -> {
                AdView view = new AdView(activity);
                banner.set(view);
                view.setAdSize(AdSize.BANNER);
                view.setAdUnitId("ca-app-pub-3940256099942544/6300978111");
                view.setAdListener(new AdListener() {
                    @Override public void onAdLoaded() { loaded.countDown(); }
                    @Override public void onAdFailedToLoad(LoadAdError error) {
                        failure.compareAndSet(null, "Banner: " + error); loaded.countDown();
                    }
                });
                activity.addContentView(view, new FrameLayout.LayoutParams(320, 50));
                view.loadAd(new AdRequest.Builder().build());
                InterstitialAd.load(activity, "ca-app-pub-3940256099942544/1033173712", new AdRequest.Builder().build(), new InterstitialAdLoadCallback() {
                    @Override public void onAdLoaded(InterstitialAd ad) { loaded.countDown(); }
                    @Override public void onAdFailedToLoad(LoadAdError error) {
                        failure.compareAndSet(null, "Interstitial: " + error); loaded.countDown();
                    }
                });
                RewardedAd.load(activity, "ca-app-pub-3940256099942544/5224354917", new AdRequest.Builder().build(), new RewardedAdLoadCallback() {
                    @Override public void onAdLoaded(RewardedAd ad) { loaded.countDown(); }
                    @Override public void onAdFailedToLoad(LoadAdError error) {
                        failure.compareAndSet(null, "Rewarded: " + error); loaded.countDown();
                    }
                });
            });
            try {
                assertTrue("Google test ads timed out", loaded.await(60, TimeUnit.SECONDS));
                assertNull(failure.get(), failure.get());
            } finally {
                scenario.onActivity(activity -> { if (banner.get() != null) banner.get().destroy(); });
            }
        }
    }
}
