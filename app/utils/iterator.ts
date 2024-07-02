import { Record } from "pocketbase";
import { client, clientId } from "../pocketbase";
import { Transaction } from "../transactions/types/transaction";
import { Observable, Setting, Settings } from "./settings";
import { ApiError } from "./errors";
import { groupByProperty } from "./functions";

interface CollectionInterface<T> {
    items: T[];
    setItems(items: T[]): void;
    getItems(): T[];
    getCount(): number;
    getIterator(): IteratorInterface<T>;
}

export class Collection<T> implements CollectionInterface<T> {
    public items: T[]

    constructor(items: T[]){
        this.items = items
    }

    public setItems(items: T[]){
        this.items = items
    }

    public getItems(): T[] {
        return this.items;
    }

    public getCount(): number {
        return this.items.length;
    }

    public addItem(item: T): void {
        this.items.push(item);
    }

    public sort(sortFn: (a: T, b: T) => number){
        this.items.sort(sortFn)
    }

    public filter(filterFn: (item: T) => boolean){
        this.items = this.items.filter(filterFn);
    }

    public find(findFn: (item: T) => boolean){
        return this.getItems().find(findFn)
    }

    public getIterator(): IteratorInterface<T> {
        return new CollectionIterator(this)
    } 
}

export class ContactCollection extends Collection<Contact>{
    constructor(items: any[]){
        super(items.map(item => new Contact(item)));
    }

    getManager(ownerId: string){
        return this.find(contact => contact.owner === ownerId && contact.user === clientId)
    }

    getLinked(){
        return new LinkedContactIterator(this)
    }
    getOwned(){
        return new OwnedContactIterator(this)
    }
    getNotOwned(){
        return new NotOwnedContactIterator(this)
    }
    getDefaults(){
        return new DefaultContactIterator(this)
    }
    getCouriers(){
        return new CourierContactIterator(this)
    }
    getManagers(){
        return new ManagerContactIterator(this)
    }
    getManageable(){
        return new ManageableContactIterator(this)
    }
}

interface IteratorInterface<T> {
    items(): T[];
    current(): T;
    next(): T;
    key(): number;
    valid(): boolean;
    rewind(): void;
    length(): number
}

class CollectionIterator<T> implements IteratorInterface<T> {
    protected collection: Collection<T>;
    protected position: number = 0;
    protected reverse: boolean = false;

    constructor(collection: Collection<T>, reverse: boolean = false) {
        this.collection = new Collection<T>(collection.getItems());
        this.reverse = reverse;

        if (reverse) {
            this.position = collection.getCount() - 1;
        }
    }
    items(): T[] {
        return this.collection.getItems()
    }

    public rewind() {
        this.position = this.reverse ?
            this.collection.getCount() - 1 :
            0;
    }

    public current(): T {
        return this.collection.getItems()[this.position];
    }

    public key(): number {
        return this.position;
    }

    public next(): T {
        const item = this.collection.getItems()[this.position];
        this.position += this.reverse ? -1 : 1;
        return item;
    }

    public valid(): boolean {
        if (this.reverse) {
            return this.position >= 0;
        }

        return this.position < this.collection.getCount();
    }

    public length(): number {
        return this.collection.getCount()    
    }
}

class TransactionIterator extends CollectionIterator<Transaction> {}

class TransactionCollection extends Collection<Transaction> {

    constructor(items: Transaction[]){
        super(items)
    }

    public getIterator() {
        return new CollectionIterator<Transaction>(this);
    }
}

class ScoreContactIterator extends CollectionIterator<Contact>{
    constructor(collection: Collection<Contact>){
        super(collection)
        this.collection.sort((a, b) => a.score - b.score)
    }
}
class BalanceContactIterator extends CollectionIterator<Contact>{
    constructor(collection: Collection<Contact>){
        super(collection)
        this.collection.sort((a, b) => a.balance - b.balance);
    }
}

export class OwnedContactIterator extends CollectionIterator<Contact>{
    constructor(collection: Collection<Contact>){
        super(collection)
        this.collection.filter(item => clientId === item.owner)

    }
} 

export class DefaultContactIterator extends CollectionIterator<Contact>{
    constructor(collection: Collection<Contact>){
        super(collection)
        this.collection.filter(item => clientId === item.owner && !item.courier)

    }
} 

export class NotOwnedContactIterator extends CollectionIterator<Contact>{
    constructor(collection: Collection<Contact>){
        super(collection)
        this.collection.filter(item => clientId !== item.owner)
    }
} 

export class LinkedContactIterator extends CollectionIterator<Contact>{
    constructor(collection: Collection<Contact>){
        super(collection)
        this.collection.filter(item => clientId === item.user)
    }
}

export class CourierContactIterator extends CollectionIterator<Contact>{
    constructor(collection: Collection<Contact>){
        super(collection)
        this.collection.filter(item => item.owner === clientId && !!item.courier)
    }
}

export class ManagerContactIterator extends CollectionIterator<Contact>{
    constructor(collection: Collection<Contact>){
        super(collection)
        this.collection.filter(item => item.user === clientId && !!item.courier)
    }
}

export class ManageableContactIterator extends CollectionIterator<Contact>{
    constructor(collection: Collection<Contact>){
        super(collection)
        this.collection.filter(item => item.owner !== clientId && item.user !== clientId)
    }

    public grouped(): {[key: string]: Contact[]}{
        return groupByProperty(this.items(), "owner")
    }
}

abstract class ApiRecord<T> extends Record implements Observable<T> {
    observers: Function[];

    constructor(collectionName: string, data){
        super(data)
        this.collectionName = collectionName
    }

    notifyObservers(): void {
        this.observers.forEach(fn => fn(this))
    }
    addObserver(fn: Function): void {
        this.observers.push(fn)
    }

    public async create(): Promise<T>{
        if(this.id) throw new Error("Cannot create Contact because it already has a ID");

        return await client.collection(this.collectionName).create<T>(this.$export);
    }


    public async updateProperty(property: string): Promise<T> {
        return await client.collection(this.collectionName).update<T>(this.id, {
            property: this[property],
        })
    }
}

export class Contact extends ApiRecord<Contact> {
    public name: string
    public linkedName: string
    public balance: number
    public score: number
    public settings: Settings
    public owner: string
    public user?: string
    public manager?: string

    constructor(data){
        const { id, name, linkedName, balance, settings, owner, user, score } = data
        super("contacts", data);
        this.name = name
        this.linkedName = linkedName
        this.balance = +balance
        this.settings = new Settings(data)
        this.owner = owner
        this.user = user
        this.score = +score || 0
        this.expand = data.expand
        this.manager = clientId !== user && clientId !== owner ? owner : null
    }

    update(): Contact {
        throw new Error("Method not implemented.");
    }
    delete(): Contact {
        throw new Error("Method not implemented.");
    }
}