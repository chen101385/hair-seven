import { describe, expect, it } from "vitest";
import { campaign } from "./sms-campaign";
import { toGsm7 } from "@/lib/sms";

describe("A2P campaign samples", () => {
  it("keeps every sample GSM-7 and includes consumer opt-out", () => {
    expect(campaign.useCase).toMatch(/Customer Care/);
    expect(campaign.useCase).toMatch(/No marketing/i);
    for (const sample of campaign.messages) {
      expect(sample.body).toBe(toGsm7(sample.body));
    }
    expect(campaign.messages[0]?.body).toMatch(/STOP/);
    expect(campaign.messages[1]?.body).toMatch(/STOP/);
    expect(campaign.messages[2]?.body).toMatch(/HELP/);
    for (const sample of campaign.messages) {
      expect(sample.body).not.toMatch(/data rates/i);
    }
  });
});
