// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

export interface ICallBackRequestParams extends ICallBackParams {
  callbackhook: any;
}

export interface ICallBackParams {
  data: any[];
  rowindex: number[];
  triggerkey: string;
  activatetriggercell: boolean;
}
