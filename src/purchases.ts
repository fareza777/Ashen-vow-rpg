import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { NativePurchases, PURCHASE_TYPE } from "@capgo/native-purchases";
import { ads } from "./admob";
import {
  PurchaseController,
  REMOVE_ADS_PRODUCT,
  type PurchasePort,
} from "./purchasesController";

const ENTITLEMENT_KEY = "ashen-vow-play-remove-ads-v1";
const androidPort: PurchasePort = {
  async isSupported() {
    return (await NativePurchases.isBillingSupported()).isBillingSupported;
  },
  async getProduct() {
    const { products } = await NativePurchases.getProducts({
      productIdentifiers: [REMOVE_ADS_PRODUCT],
      productType: PURCHASE_TYPE.INAPP,
    });
    const product = products.find(
      (value) => value.identifier === REMOVE_ADS_PRODUCT && !value.offerId,
    );
    return product
      ? {
          id: product.identifier,
          price: product.priceString,
          offerToken: product.offerToken,
        }
      : null;
  },
  async getPurchases() {
    return (
      await NativePurchases.getPurchases({ productType: PURCHASE_TYPE.INAPP })
    ).purchases;
  },
  purchase(product) {
    return NativePurchases.purchaseProduct({
      productIdentifier: product.id,
      offerToken: product.offerToken,
      productType: PURCHASE_TYPE.INAPP,
      quantity: 1,
      isConsumable: false,
      // Acknowledge explicitly after checking the purchased state and exact SKU.
      autoAcknowledgePurchases: false,
    });
  },
  acknowledge: (purchaseToken) =>
    NativePurchases.acknowledgePurchase({ purchaseToken }),
};

export const purchases = new PurchaseController(
  Capacitor.getPlatform() === "android" ? androidPort : null,
  {
    read: async () => (await Preferences.get({ key: ENTITLEMENT_KEY })).value,
    write: (value) => Preferences.set({ key: ENTITLEMENT_KEY, value }),
  },
  (owned) => ads.setAdFree(owned),
);
