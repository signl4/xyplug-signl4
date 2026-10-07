# SIGNL4 Action Plugin for xyOps

Send xyOps events and job results to SIGNL4 for reliable mobile alerting, on-call routing, acknowledgement, automated escalation, and fast incident response.

## What it does

The plugin receives xyOps Action Plugin data as JSON via `STDIN`, converts the relevant event and job information into a SIGNL4 webhook payload, and sends it to SIGNL4.

Typical flow:

```text
xyOps event or job
      ↓
SIGNL4 Action Plugin
      ↓
SIGNL4 webhook
      ↓
App push / SMS / voice call
      ↓
On-call routing / escalation / acknowledgement
```

A typical use case is:

```text
xyOps job fails
      ↓
On Error → SIGNL4
      ↓
Responsible on-call person is alerted
      ↓
Job succeeds again
      ↓
On Success → SIGNL4
      ↓
Corresponding SIGNL4 alert is resolved
```

## Requirements

- xyOps
- Node.js 18 or newer
- npm / npx
- Git when running the plugin directly from GitHub
- Internet access to `connect.signl4.com`
- SIGNL4 account and team/integration secret

## Installation

Create an **Action Plugin** in xyOps.

When running directly from GitHub, use:

```text
npx -y github:signl4/xyplug-signl4#v1.0.0
```

For example, when using `/bin/sh` as the plugin executable:

```sh
exec npx -y github:signl4/xyplug-signl4#v1.0.0
```

## SIGNL4 Secret

Create a Secret Vault in xyOps and add:

```text
SIGNL4_TEAM_SECRET
```

Set its value to the SIGNL4 team/integration secret and grant the SIGNL4 Action Plugin access to the vault.

The secret is used to send events to:

```text
https://connect.signl4.com/webhook/{team-secret}
```

Do not configure the SIGNL4 team secret as a normal plugin parameter.

## Configuration

The plugin supports the following optional parameters:

- `title` – custom alert title
- `message` – custom alert message
- `service` – optional SIGNL4 service
- `location` – optional location, for example `52.5200,13.4050`
- `resolveOnClear` – controls automatic resolution for clear/success conditions

Without custom parameters, the plugin uses information provided by the xyOps event, alert, or job.

## Alerting and resolution

For correlated alerting, configure separate xyOps actions:

```text
On Error   → SIGNL4
On Success → SIGNL4
```

An error sends:

```text
X-S4-Status: new
```

A successful recovery sends:

```text
X-S4-Status: resolved
```

The xyOps Event ID is used as `X-S4-ExternalID` whenever available.

This means an error and a later successful execution of the same xyOps Event can be correlated in SIGNL4:

```text
Error
Event ID: emuy8rid94wmygqk
X-S4-ExternalID: emuy8rid94wmygqk
X-S4-Status: new

        ↓

Success
Event ID: emuy8rid94wmygqk
X-S4-ExternalID: emuy8rid94wmygqk
X-S4-Status: resolved
```

This allows SIGNL4 to automatically resolve the corresponding alert when the xyOps Event returns to a successful state.

> **Note:** `On Complete` is not suitable for automatic error/recovery correlation because xyOps passes the condition as `complete` regardless of whether the underlying execution succeeded or failed.

## Data sent to SIGNL4

Depending on the information available from xyOps, the payload can contain fields such as:

```text
Title
Message
Condition
EventID
JobID
AlertID
X-S4-SourceSystem
X-S4-ExternalID
X-S4-Status
```

Example:

```json
{
  "Title": "Database Backup",
  "Message": "Backup failed",
  "Condition": "error",
  "EventID": "emuy8rid94wmygqk",
  "JobID": "jmuy8riky56dz724",
  "X-S4-SourceSystem": "xyOps",
  "X-S4-ExternalID": "emuy8rid94wmygqk",
  "X-S4-Status": "new"
}
```

## Local test

Set the SIGNL4 team secret as an environment variable.

Linux / macOS:

```bash
export SIGNL4_TEAM_SECRET="your-team-secret"
```

Then test an error:

```bash
echo '{"condition":"error","event":{"id":"test-event-123","title":"Database Backup"},"job":{"id":"test-job-123","name":"Database Backup","description":"Backup failed"}}' | node index.js
```

To test resolution using the same Event ID:

```bash
echo '{"condition":"success","event":{"id":"test-event-123","title":"Database Backup"},"job":{"id":"test-job-124","name":"Database Backup","description":"Backup successful"}}' | node index.js
```

The first request should create a SIGNL4 alert and the second should resolve it.

## Test with xyOps

A convenient way to test the integration is with the xyOps **Test Plugin**.

Configure two SIGNL4 actions:

```text
On Error   → SIGNL4
On Success → SIGNL4
```

First simulate an error. A SIGNL4 alert should be created.

Then simulate success for the same Event. The corresponding SIGNL4 alert should be resolved.

## About SIGNL4

SIGNL4 adds reliable mobile alerting and incident response to operational systems.

Key capabilities include:

- Mobile app push, SMS, and voice calls
- Automated escalation until someone responds
- On-call and shift-based routing
- Acknowledgements and mobile collaboration
- Alert enrichment and categorization
- Reliable 24/7 notification of critical events

Learn more at [www.signl4.com](https://www.signl4.com/).

## xyOps Marketplace

This repository contains the files required for publishing the integration as an xyOps plugin.

Before submitting a new release:

1. Verify the plugin with the current xyOps version.
2. Verify both `On Error` and `On Success` behavior.
3. Verify the exported `xyops.json`.
4. Make sure `index.js` is executable.
5. Create a Git tag/release such as `v1.0.0`.
6. Submit the plugin according to the current xyOps Marketplace instructions.

## License

MIT
