import handler from ".";

const NO_ARG_FUN = () => {};
const MERGE_RESULT = {};

describe("merge:mergeEntities Test", () => {
    let data = undefined;

    beforeAll(async () => {
        data = handler(NO_ARG_FUN);
    });

    afterAll(async () => {
        // NONE
    });

    it("merge result should exist", () => expect(data).toBeDefined());
    it("merge result should be the same like the template", () => expect(data).toEqual(MERGE_RESULT));
});