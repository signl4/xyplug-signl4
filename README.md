# SIGNL4 Action Plugin for xyOps

Send xyOps job and alert events to SIGNL4 for reliable mobile alerting, on-call routing, acknowledgement and escalation.

## What it does

The plugin reads xyOps Action Plugin input as JSON from `STDIN`, converts relevant job/alert/event fields into a SIGNL4 webhook payload, and sends it to:

```text
https://connect.signl4.com/webhook/{team-secret}
```

Typical flow:

```text
xyOps job or alert
      ↓
SIGNL4 xyOps Action Plugin
      ↓
SIGNL4 webhook
      ↓
App push / SMS / voice / escalation / on-call routing
```

## Requirements

- xyOps
- Node.js 18 or newer
- Internet access to `connect.signl4.com`
- SIGNL4 team/integration secret

## Configuration

Create an Action Plugin in xyOps and use:

```text
npx -y github:signl4/xyplug-signl4#v1.0.0
```

Add a secret named:

```text
SIGNL4_TEAM_SECRET
```

Optional parameters:

- `title` – custom alert title
- `message` – custom alert message
- `service` – optional SIGNL4 service
- `location` – optional location
- `resolveOnClear` – resolve correlated SIGNL4 alerts on clear/success events

## Correlation and resolution

The plugin sends an `X-S4-ExternalID` based on the xyOps alert, event, or job ID. For resolved/cleared/success conditions, it sends `X-S4-Status: resolved` so SIGNL4 can close the corresponding alert.

The exact xyOps condition names and payload structure can vary by event type, so test with your xyOps installation and adjust the mappings in `index.js` if necessary.

## Local test

Set the environment variable:

```bash
export SIGNL4_TEAM_SECRET="your-team-secret"
```

Then run:

```bash
echo '{"condition":"error","job":{"id":"123","name":"Database Backup","description":"Backup failed"}}' | node index.js
```

## Marketplace

Before submitting to the xyOps Marketplace:

1. Push this repository to GitHub, ideally as `signl4/xyplug-signl4`.
2. Replace `logo.png` with the official square SIGNL4 logo.
3. Verify the exported `xyops.json` against your current xyOps version.
4. Create a `v1.0.0` Git tag/release.
5. Submit the plugin to the xyOps Marketplace repository according to their current marketplace instructions.

## License

MIT
