import "source-map-support/register";
import * as _debug from "debug";
import * as jsonpath from "jsonpath";

const debug = _debug("jslambda-debug-handler");
const error = _debug("jslambda-error-handler");

export type HandlerBasicFunction = Function | Promise<Function>;
export type HandlerImportFunction = {default: HandlerBasicFunction} | Promise<{default: HandlerBasicFunction}>;
export type HandlerFunction = HandlerBasicFunction | HandlerImportFunction;

const caller = async (fun: HandlerFunction, obligatoryArgsJsonPath: string[] = [],
                      optionalArgsJsonPath: string[] = [], event): Promise<any> => {
    // empty event is {}
    event = event || {};

    // Check if event.Records[0].Sns.Message exist
    let snsEvent = (((event.Records && event.Records[0]) || {}).Sns || {}).Message;

    let body: any = snsEvent || event.body || event.arguments || event;
    body = (typeof body === "string") ? JSON.parse(body) : body;
    const nonExistingObligatoryArgs = obligatoryArgsJsonPath
        .filter(argName => jsonpath.value(body, argName) === undefined);
    if (nonExistingObligatoryArgs.length > 0) {
        throw new Error(`There are obligatory fields missing in the parameters for JSONPaths: ` +
            `[${nonExistingObligatoryArgs.join(",")}].`);
    }
    const ArgsJsonPath = obligatoryArgsJsonPath.concat(optionalArgsJsonPath);
    const args = ArgsJsonPath.map(argName => jsonpath.value(body, argName));
    debug(`call with parameter values ${JSON.stringify(args)}`);

    const awaitedFun = await fun;
    const importedFun = ("default" in awaitedFun) ?  awaitedFun.default : awaitedFun;
    const importedAwaitedFun = await importedFun;
    const results = await importedAwaitedFun(...args);

    const response = (!event.body) ? results : {
        statusCode: 200,
        body: JSON.stringify(results),
    };
    return response;
};

const errorHandler = (err, callback, doThrowError: boolean) => {
    err.status = err.status || false;
    err.errorType = err.errorType || "Error";
    err.statusCode = err.statusCode || 500;
    err.stackTrace = err.stackTrace || [];
    err.body = err.body || err.message || err.msg || err.errorMessage;
    (doThrowError) ? callback(null, err) : callback(err);
    //throw err;
    error(`ERROR: ${JSON.stringify(err)}`);
    // force to exit the process so no waiting for timeout
    process.exit(-1);
};

// can encode data (ex. adding custom result code)
export const handler = (fun: HandlerFunction, obligatoryArgsJsonPath: string[] = [],
         optionalArgsJsonPath: string[] = [], doThrowError = false, doAsyncExecution = false) => {
    return async (event, context, callback): Promise<void> => {
        try {
            debug(`calling with event ${JSON.stringify(event)}; context ${JSON.stringify(context)}; ` +
                `obligatoryArgs ${obligatoryArgsJsonPath}, optionalArgs ${optionalArgsJsonPath}`);
            const responsePromise = caller(fun, obligatoryArgsJsonPath, optionalArgsJsonPath, event);
            const response = (!doAsyncExecution) ? await responsePromise : {};
            debug(`returning value ${JSON.stringify(response)}`);
            callback(null, response);
            debug('calling afer the response')
            // force to exit the process so no waiting for timeout
            // process.exit(0);
        } catch (err) {
            errorHandler(err, callback, doThrowError);
        }
    }
};

export default handler;