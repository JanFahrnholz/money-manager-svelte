this.addEventListener("install", async () => {
    console.log("installed sw", this)
})

this.addEventListener("activate", async () => {
    console.log("activate sw", this)

    try {
        const options = {}
        const subscription = await self.registration.pushManager.getSubscription()
        console.log((subscription))
    } catch (err) {
        console.log('Error', err)
    }
})

// urlB64ToUint8Array is a magic function that will encode the base64 public key
// to Array buffer which is needed by the subscription option
const urlB64ToUint8Array = base64String => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
    const rawData = atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}
self.addEventListener('activate', async () => {
    // This will be called only once when the service worker is activated.
    try {
        const options = {
            applicationServerKey: "BHPn55cE-pOa8RK4j-IAq-tfdyIGmf8rCb5rHYxJl6zepNxBLvzSp2Vp0S4aRrxOoNmkzPQrn9tGVKL5K-iltLI",
            userVisibleOnly: true
        };
        console.log(options)
        const subscription = await self.registration.pushManager.subscribe(options)
        console.log(JSON.stringify(subscription))
    } catch (err) {
        console.log('Error', err)
    }
})