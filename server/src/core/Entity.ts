/**
 * ECS Core: Entity base class
 */

export class Component {
  // Marker class for type checking
}

export class Entity {
  public id: number;
  private components: Map<string, Component> = new Map();

  constructor(id: number) {
    this.id = id;
  }

  addComponent(component: Component): void {
    const key = component.constructor.name;
    this.components.set(key, component);
  }

  removeComponent<T extends Component>(componentClass: new () => T): boolean {
    const key = componentClass.name;
    return this.components.delete(key);
  }

  getComponent<T extends Component>(componentClass: new () => T): T | undefined {
    const key = componentClass.name;
    return this.components.get(key) as T | undefined;
  }

  hasComponent<T extends Component>(componentClass: new () => T): boolean {
    const key = componentClass.name;
    return this.components.has(key);
  }

  getAllComponents(): Component[] {
    return Array.from(this.components.values());
  }

  serialize(): any {
    const data: any = { id: this.id, components: {} };
    this.components.forEach((component, key) => {
      data.components[key] = Object.assign({}, component);
    });
    return data;
  }
}
