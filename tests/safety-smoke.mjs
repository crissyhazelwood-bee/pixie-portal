import assert from "node:assert/strict";
import { analyzeSafety, containsManipulativeAttachment, safeAssistantRedirect } from "../functions/_utils/filter.js";

const journalCrisis = analyzeSafety("I want to die and I might hurt myself tonight.");
assert.equal(journalCrisis.flagged, true);
assert.equal(journalCrisis.crisis, true);
assert.ok(journalCrisis.categories.includes("self_harm"));
assert.ok(journalCrisis.support.message.includes("988"));

const abuse = analyzeSafety("They threatened me and won't let me leave.");
assert.equal(abuse.flagged, true);
assert.ok(abuse.categories.includes("abuse_or_coercion"));

const dependency = analyzeSafety("Only you understand me, please stay with me forever.");
assert.equal(dependency.flagged, true);
assert.ok(dependency.categories.includes("dependency"));

assert.equal(containsManipulativeAttachment("Only I understand you, stay with me forever."), true);

const redirect = safeAssistantRedirect(journalCrisis);
assert.ok(redirect.includes("988"));
assert.ok(redirect.includes("trusted person"));
assert.equal(/stay with me forever|only i understand you/i.test(redirect), false);

console.log("AIIT-THRESI runtime safety smoke checks passed");
