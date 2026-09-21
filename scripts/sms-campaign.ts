/**
 * Paste-ready A2P campaign samples. `npm run sms:campaign`
 */

import { campaign } from "../content/sms-campaign";
import { smsSegmentCount, SMS_SEGMENT_LENGTH, toGsm7 } from "../lib/sms";

console.log("Use case / campaign description\n");
console.log(campaign.useCase);
console.log("");

for (const note of campaign.notes) {
  console.log(`- ${note}`);
}

for (const sample of campaign.messages) {
  const gsm7 = sample.body === toGsm7(sample.body);
  const length = sample.body.length;
  const segments = smsSegmentCount(length);
  console.log(`\n### ${sample.label}`);
  console.log(
    `Length: ${length} GSM-7 characters (${segments} ${
      segments === 1 ? "text" : "texts"
    }; ${SMS_SEGMENT_LENGTH} is one text). GSM-7 clean: ${gsm7 ? "yes" : "NO"}`,
  );
  console.log(sample.body);
}
