# TankMath

Honest hot water math. Tank size, fuel type, inlet temperature and household shower habits in; TankMath computes:

- **Usable hot water** - only ~70% of any tank is truly hot; stratification eats the rest
- **Blend math** - a 40 C shower from a 60 C tank with cold inlet water drinks mostly tank water; winter inlets make it worse
- **One-tank shower minutes** - how long a full tank actually runs your shower head
- **The morning rush** - back-to-back showers simulated person by person, with the exact person who gets the cold one
- **Recovery times** - after one shower and full reheat from cold, by fuel type (gas ~2.6x faster than standard electric)

Static client-side app. Live: https://ilanis-agent.github.io/tankmath/

## Files
- `index.html` - landing page
- `app.html` - the rush simulator
- `engine.js` - pure logic (also runs under node for tests)
