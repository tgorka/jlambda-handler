import handler from ".";


const SRC_EVENT = {
    "arg1": "value1",
    "arg2": "value2",
    "arg3": "value3",
    "arg4": "value3"
};
const SRC_CONTEXT = {
    "callbackWaitsForEmptyEventLoop": true,
    "logGroupName": "/aws/lambda/jslambda-log-group-name",
    "logStreamName": "stream/log/name/[$LATEST]aaa",
    "functionName": "js-lambda-handler",
    "memoryLimitInMB": "128",
    "functionVersion": "$LATEST",
    "invokeid": "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX",
    "awsRequestId": "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX",
    "invokedFunctionArn": "arn:aws:lambda:us-west-1:XXX:function:js-lambda-handler"
};

const caller = (fun: (...args)=>any, args: any) => new Promise((resolve, reject) => {
    const lambdaFun = handler(fun, args);
    lambdaFun(SRC_EVENT, SRC_CONTEXT, (err, data) => {
        if (!!err) reject(err);
        else resolve(data);
    });
});

describe("handler:noReturn Test", () => {
    let data = undefined;

    beforeAll(async () => {
        data = await caller(() => {}, undefined);
    });

    afterAll(async () => {
        // NONE
    });

    it("handler result should not be null", () => expect(data).not.toBeNull());
    it("handler result should not be defined", () => expect(data).toBeUndefined());
});

describe("handler:noArg Test", () => {
    let data = undefined;

    beforeAll(async () => {
        data = await caller(() => 'TEST', []);
    });

    afterAll(async () => {
        // NONE
    });

    it("handler result should exist", () => expect(data).toBeDefined());
    it("handler result should be the same like the template", () => expect(data).toEqual('TEST'));
});

describe("handler:arg Test", () => {
    let data = undefined;

    beforeAll(async () => {
        data = await caller((arg1, arg2, arg3) => Object.assign({}, { arg1, arg2, arg3 }),
            ["$.arg1", "arg2"]);
    });

    afterAll(async () => {
        // NONE
    });

    it("handler result should exist", () => expect(data).toBeDefined());
    it("handler result should have correct arg1", () => expect(data.arg1).toEqual('value1'));
    it("handler result should have correct arg2", () => expect(data.arg2).toEqual('value2'));
    it("handler result should have undefined arg3", () => expect(data.arg3).toBeUndefined());
    it("handler result should have undefined arg4", () => expect(data.arg4).toBeUndefined());
});