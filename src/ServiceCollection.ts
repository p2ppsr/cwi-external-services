export class ServiceCollection<T> {
    services: { name: string; service: T; }[];
    _index: number;

    constructor() {
        this.services = [];
        this._index = 0;
    }

    add(s: { name: string; service: T; }): ServiceCollection<T> {
        this.services.push(s);
        return this;
    }

    get name() { return this.services[this._index].name; }

    get service() { return this.services[this._index].service; }

    get allServices() { return this.services.map(x => x.service) }

    get count() { return this.services.length; }
    get index() { return this._index; }

    next(): number {
        this._index = (this._index + 1) % this.count;
        return this._index;
    }
}
