import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { summarise } from "../dist/experiments/01-sampling.js";

describe("summarise", () => {
  it("counts distinct outputs after normalising case and whitespace", () => {
    const s = summarise(0.7, ["A b", "a  B", "c"]);
    assert.equal(s.n, 3);
    assert.equal(s.distinct, 2);
    assert.equal(s.distinctRatio, 2 / 3);
    assert.equal(s.topShare, 2 / 3);
  });

  it("reports the most common output in its original casing", () => {
    const s = summarise(1.0, ["Alpha", "alpha", "Beta"]);
    assert.equal(s.mostCommon, "Alpha");
    assert.equal(s.topShare, 2 / 3);
  });

  it("handles an empty sample set without dividing by zero", () => {
    const s = summarise(0, []);
    assert.equal(s.distinct, 0);
    assert.equal(s.distinctRatio, 0);
    assert.equal(s.topShare, 0);
  });

  it("treats a fully deterministic run as one distinct output", () => {
    const s = summarise(0, ["same", "same", "same", "same"]);
    assert.equal(s.distinct, 1);
    assert.equal(s.topShare, 1);
  });
});
