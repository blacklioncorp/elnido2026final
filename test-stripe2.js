const { createClient } = require('@supabase/supabase-js');
async function run() {
  const stripeApi = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data } = await supabase.from('donaciones').select('stripe_subscription_id, monto').eq('donante_email', 'safelunch772@gmail.com').limit(1);
  const subId = data[0].stripe_subscription_id;
  const nuevoMonto = 120; 
  
  try {
    const subscription = await stripeApi.subscriptions.retrieve(subId);
    let productId = subscription.items.data[0].price.product;
    
    await stripeApi.products.update(productId, { active: true });
    
    const price = await stripeApi.prices.create({
      currency: 'mxn',
      unit_amount: Math.round(nuevoMonto * 100),
      recurring: { interval: 'month' },
      product: productId,
    });

    const update = await stripeApi.subscriptions.update(subId, {
      items: [{
        id: subscription.items.data[0].id,
        price: price.id,
      }],
      proration_behavior: 'none',
    });
    console.log("Update success!");
  } catch (err) {
    console.error("Stripe error:", err.message);
  }
}
run();
