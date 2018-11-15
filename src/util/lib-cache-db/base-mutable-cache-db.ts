/* 
 * Copyright (C) 2018 Qli5. All Rights Reserved.
 * 
 * @author qli5 <goodlq11[at](163|gmail).com>
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import CommonCacheDB, { FileLike } from './common-cache-db.js';

export interface MutationInit {
    name?: string
    offset?: number
    append?: boolean
    truncate?: boolean
}

export interface NamedMutationInit extends MutationInit {
    name: string
}

export interface NamedArrayBuffer extends ArrayBuffer {
    name: string
}

abstract class BaseMutableCacheDB implements CommonCacheDB {
    dbName: string
    storeName: string

    constructor(dbName: string, storeName: string) {
        this.dbName = dbName;
        this.storeName = storeName;
    }

    abstract async createData(item: FileLike | NamedArrayBuffer): Promise<any>
    abstract async createData(item: Blob | ArrayBuffer, name: string): Promise<any>
    abstract async createData(item: Blob | ArrayBuffer, options: NamedMutationInit): Promise<any>

    abstract async setData(item: FileLike | NamedArrayBuffer, options?: MutationInit): Promise<any>
    abstract async setData(item: Blob | ArrayBuffer, name: string, options?: MutationInit): Promise<any>
    abstract async setData(item: Blob | ArrayBuffer, options: NamedMutationInit): Promise<any>

    abstract async appendData(item: FileLike | NamedArrayBuffer, options?: MutationInit): Promise<any>
    abstract async appendData(item: Blob | ArrayBuffer, name: string, options?: MutationInit): Promise<any>
    abstract async appendData(item: Blob | ArrayBuffer, options: NamedMutationInit): Promise<any>

    abstract async getData(name: string): Promise<File | null>

    abstract async hasData(name: string): Promise<boolean>

    abstract async deleteData(name: string): Promise<any>

    abstract async renameData(name: string, newName: string): Promise<any>

    abstract async createWriteStream(options: NamedMutationInit): Promise<WritableStream>
    abstract async createWriteStream(name: string, options?: MutationInit): Promise<WritableStream>

    async createReadStream(name: string) {
        const data = await this.getData(name)
        if (!data) return null;
        return new Response(data).body;
    }

    async getObjectURL(name: string) {
        const data = await this.getData(name);
        if (!data) return null;
        return URL.createObjectURL(data);
    }

    async getText(name: string) {
        const data = await this.getData(name);
        if (!data) return null;
        return new Promise<string>((resolve, reject) => {
            const e = new FileReader();
            e.onload = () => resolve(e.result as string);
            e.onerror = reject;
            e.readAsText(data);
        });
    }

    async getJSON<T>(name: string) {
        const data = await this.getData(name);
        if (!data) return null;
        return new Promise<T>((resolve, reject) => {
            const e = new FileReader();
            e.onload = () => resolve(JSON.parse(e.result as string));
            e.onerror = reject;
            e.readAsText(data);
        });
    }

    async getRespone(name: string) {
        const data = await this.getData(name)
        if (!data) return null;
        return new Response(data);
    }

    get getReadStream() {
        return this.createReadStream;
    }

    abstract async deleteAllData(): Promise<any>

    abstract async deleteEntireDB(): Promise<any>

    static get isSupported() { return false }

    static async cloneBlob(file: Blob & { name: string, type?: string, lastModified?: number }): Promise<File>
    static async cloneBlob(file: Blob): Promise<Blob>
    static async cloneBlob(file: Blob & { name?: string, type?: string, lastModified?: number }) {
        const ret = new Response(file).blob();
        if (file.name) {
            return new File([await ret], file.name, file)
        }
        return ret;
    }

    static async quota() { return { usage: -1, quota: -1 } as StorageEstimate; }
}

export { BaseMutableCacheDB }
export default BaseMutableCacheDB;
