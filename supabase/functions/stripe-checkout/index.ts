// File: supabase/functions/stripe-checkout/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  try {
    const { amount, currency } = await req.json();

    // 1. Create a PaymentIntent securely on the server
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount must be strictly in cents/paise
      currency: currency,
    });

    // 2. Return the secure client_secret back to the React Native app
    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret, id: paymentIntent.id }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
});
