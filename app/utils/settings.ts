import { Record } from "pocketbase"
import { client } from "../pocketbase";
import { ApiError } from "./errors";
import { _ } from "svelte-i18n";

export class Observable<T> {
    observers: Function[]

    constructor(){
        this.observers = []
    }

    notifyObservers(value: T) {
        this.observers.forEach(fn => fn(value))
    } 
    addObserver(fn: Function){
        this.observers.push(fn)
    }
}

export class Setting {
    public key: string
    public dataType: string
    protected value: any

    constructor(key, initialValue = null){
        this.key = key
        this.dataType = typeof initialValue
        this.set(initialValue)
    }

    set(value){        
        this.value = value
    }

    get(){
        return this.value
    }
}

export class Settings extends Observable<Settings> {
    protected context: Record
    protected defaults?: Settings
    protected data: {
        [key: string]: Setting
    } = {}

    constructor(context: Record, defaults?: Settings){
        super();
        this.context = context
        this.defaults = defaults

        for(const [key, value] of Object.entries(context?.settings ? context.settings : {})){
            this.data[key] = new Setting(key, value)
        }

        if(defaults){
            for(const [key, value] of Object.entries(defaults.serialized())){
                if(!this.data[key]) this.data[key] = new Setting(key, "default")
            }
        }
    }

    async updateContext(){
        try {
            this.context = await client.collection(this.context.collectionName).update(this.context.id, {
                settings: this.serialized()
            })
        } catch (e) {
            throw new ApiError(e).dialog()
        }
    }

    serialized(){
        const data = {}

        for(const [key, setting] of Object.entries(this.data)){
            data[key] = setting.get();
        }
        return data
    }

    getSettings(){
        return Object.values(this.data)
    }

    public get(key = null){
        if(!key) return this.data

        if(this.data[key]?.get() !== "default") return this.data[key]?.get()

        return this.defaults?.get(key)
    }

    async set(key: string, value: any){
        const initialValue = this.get(key)
        try {
            this.data[key].set(value)
            await this.updateContext()
        } catch (error) {
            this.data[key].set(initialValue)
            console.error(error)
        }
        this.notifyObservers(this)
    }

    setDefault(key: string, value: any){
        this.defaults.set(key, value)
    }

    getDefault(key: string){
        return this.defaults?.get(key)
    }

    hasDefault(key: string){
        return !!this.defaults?.get(key)
    }

    isDefault(key: string){
        if(!this.defaults.data[key]) return false
        return this.data[key]?.get() === "default"
    }
}

export class UserSettings extends Settings {
    constructor(user: Record){
        if(user.settings === null) user.settings = {};

        const defaults = { 
            "showStatisticsContact": false,
            "showStatisticsHomepage": false
        };

        for(const [key, value] of Object.entries(user.settings)){
            if(defaults[key] !== undefined) defaults[key] = value
        }
         
        user.settings = defaults

        super(user)
    }
}

export class ContactSettings extends Settings {
    constructor(contact: Record, user: Record){
        super(contact, new UserSettings(user))    
    }
}