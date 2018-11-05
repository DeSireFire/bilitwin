/***
 * Copyright (C) 2018 Qli5. All Rights Reserved.
 * 
 * @author qli5 <goodlq11[at](163|gmail).com>
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

// @ts-ignore: this import statement will be handled by rollup
import embeddedHTML from './embedded.html';
import { SimpleProgressEvent } from './util/common-types';

declare const embeddedHTML: string

interface WorkerWinInit {
    onflvprogress?: (event: SimpleProgressEvent) => void
    onfileload?: (event: SimpleProgressEvent) => void
    onmkvprogress?: (event: SimpleProgressEvent) => void
    name?: string
    flv: Blob | string | ArrayBuffer
    ass: Blob | string | ArrayBuffer
}

interface WorkerWin extends Window {
    exec(init: WorkerWinInit): Promise<string>
}

class FLVASS2MKVBundle {
    workerWin: WorkerWin | null
    option?: Partial<WorkerWinInit>

    constructor(option?: FLVASS2MKVBundle['option']) {
        this.workerWin = null;
        this.option = option;
    }

    /**
     * FLV + ASS => MKV entry point
     */
    exec(flv: Blob | string | ArrayBuffer, ass: Blob | string | ArrayBuffer, name?: string) {
        // 1. Allocate for a new window
        if (!this.workerWin) this.workerWin = top.open('', undefined, ' ') as WorkerWin;

        // 2. Inject scripts
        this.workerWin.document.write(embeddedHTML);
        this.workerWin.document.close();

        // 3. Invoke exec
        if (!(this.option instanceof Object)) this.option = undefined;
        this.workerWin.exec(Object.assign({}, this.option, { flv, ass, name }));
        if (typeof flv === 'string') URL.revokeObjectURL(flv);
        if (typeof ass === 'string') URL.revokeObjectURL(ass);

        // 4. Free parent window
        // if (top.confirm('MKV打包中……要关掉这个窗口，释放内存吗？')) 
        top.location.assign('about:blank');
    }
}

export default FLVASS2MKVBundle;
