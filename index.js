#!/usr/bin/env node

const chunks = [];

for await (const chunk of process.stdin) {
  chunks.push(chunk);
}

let input;

try {
  input = JSON.parse(Buffer.concat(chunks).toString() || '{}');
}
catch (err) {
  console.log(JSON.stringify({
    xy: 1,
    code: 1,
    description: `Invalid JSON input: ${err.message}`
  }));

  process.exit(1);
}

const params = input.params || {};
const secrets = input.secrets || {};
const job = input.job || {};
const alert = input.alert || {};
const event = input.event || {};

const teamSecret =
  secrets.SIGNL4_TEAM_SECRET ||
  secrets.signl4_team_secret ||
  params.teamSecret ||
  process.env.SIGNL4_TEAM_SECRET;

if (!teamSecret) {
  console.log(JSON.stringify({
    xy: 1,
    code: 1,
    description: 'SIGNL4 team secret is missing. Configure SIGNL4_TEAM_SECRET as an xyOps secret.'
  }));

  process.exit(1);
}

const condition =
  input.condition ||
  event.condition ||
  alert.condition ||
  'unknown';

const normalizedCondition = String(condition).toLowerCase();

/*
 * Prefer Event ID for correlation because the Event ID remains stable
 * across multiple executions, while the Job ID can change on every run.
 */
const externalId =
  event.id ||
  alert.id ||
  params.externalId ||
  job.id ||
  `xyops-${Date.now()}`;

const title =
  params.title ||
  alert.title ||
  event.title ||
  job.title ||
  job.name ||
  'xyOps Alert';

const message =
  params.message ||
  alert.message ||
  event.message ||
  job.description ||
  job.message ||
  `xyOps condition: ${condition}`;

const isResolved = [
  'resolved',
  'clear',
  'cleared',
  'closed',
  'ok',
  'success'
].includes(normalizedCondition);

const payload = {
  Title: title,
  Message: message,
  Condition: condition,

  'X-S4-SourceSystem': 'xyOps',
  'X-S4-ExternalID': String(externalId),

  /*
   * SIGNL4 uses the same X-S4-ExternalID to correlate
   * new and resolved events.
   */
  'X-S4-Status':
    isResolved && params.resolveOnClear !== false
      ? 'resolved'
      : 'new'
};

if (params.service) {
  payload['X-S4-Service'] = params.service;
}

if (params.location) {
  payload['X-S4-Location'] = params.location;
}

/*
 * Add useful xyOps context to the SIGNL4 event.
 */
for (const [key, value] of Object.entries({
  Job: job.name || job.title,
  JobID: job.id,
  AlertID: alert.id,
  EventID: event.id
})) {
  if (
    value !== undefined &&
    value !== null &&
    value !== ''
  ) {
    payload[key] = value;
  }
}

try {
  const response = await fetch(
    `https://connect.signl4.com/webhook/${encodeURIComponent(teamSecret)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }
  );

  if (!response.ok) {
    const body = await response.text().catch(() => '');

    throw new Error(
      `SIGNL4 returned HTTP ${response.status}` +
      (body ? `: ${body}` : '')
    );
  }

  console.log(JSON.stringify({
    xy: 1,
    code: 0,
    description: isResolved
      ? 'SIGNL4 alert resolved successfully.'
      : 'SIGNL4 alert sent successfully.'
  }));
}
catch (err) {
  console.log(JSON.stringify({
    xy: 1,
    code: 1,
    description: err.message
  }));

  process.exit(1);
}
