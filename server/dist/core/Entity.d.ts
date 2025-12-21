/**
 * ECS Core: Entity base class
 */
export declare class Component {
}
export declare class Entity {
    id: number;
    private components;
    constructor(id: number);
    addComponent(component: Component): void;
    removeComponent<T extends Component>(componentClass: new () => T): boolean;
    getComponent<T extends Component>(componentClass: new () => T): T | undefined;
    hasComponent<T extends Component>(componentClass: new () => T): boolean;
    getAllComponents(): Component[];
    serialize(): any;
}
//# sourceMappingURL=Entity.d.ts.map