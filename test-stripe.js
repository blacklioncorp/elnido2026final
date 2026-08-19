async function run() {
  const stripeApi = require('stripe')(process.env.STRIPE_SECRET_KEY);
  try {
    const subId = 'sub_1U5cGHOAyFegKwVpX9Vplszc'; // from the screenshot
    const subscription = await stripeApi.subscriptions.retrieve(subId);
    console.log("Sub item:", subscription.items.data[0].id);
    
    const price = await stripeApi.prices.create({
      currency: 'mxn',
      unit_amount: Math.round(150 * 100),
      recurring: { interval: 'month' },
      product: subscription.items.data[0].price.product,
    });
    console.log("Created price:", price.id);

    const update = await stripeApi.subscriptions.update(subId, {
      items: [{
        id: subscription.items.data[0].id,
        price: price.id,
      }],
      proration_behavior: 'none',
    });
    console.log("Update success!");
  } catch (err) {
    console.error("Stripe error:", err);
  }
}
run();
