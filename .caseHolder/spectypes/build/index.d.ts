export declare const parseStrict: import("spectypes/dist/dts/types").Spec<["object"], "validator", {
    readonly string: string;
    readonly number: number;
    readonly boolean: boolean;
    readonly negNumber: number;
    readonly maxNumber: number;
    readonly longString: string;
    readonly deeplyNested: {
        readonly foo: string;
        readonly num: number;
        readonly bool: boolean;
    };
}>;
export declare const parseSafe: import("spectypes/dist/dts/types").Spec<["struct"], "transformer", {
    readonly string: string;
    readonly number: number;
    readonly boolean: boolean;
    readonly negNumber: number;
    readonly maxNumber: number;
    readonly longString: string;
    readonly deeplyNested: {
        readonly foo: string;
        readonly num: number;
        readonly bool: boolean;
    };
}>;
export declare const assertLoose: import("spectypes/dist/dts/types").Spec<["object-record"], "validator", {
    [x: string]: unknown;
    readonly string: string;
    readonly number: number;
    readonly boolean: boolean;
    readonly negNumber: number;
    readonly maxNumber: number;
    readonly longString: string;
    readonly deeplyNested: {
        [x: string]: unknown;
        readonly foo: string;
        readonly num: number;
        readonly bool: boolean;
    };
}>;
