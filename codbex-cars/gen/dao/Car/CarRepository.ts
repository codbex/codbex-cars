import { query } from "sdk/db";
import { producer } from "sdk/messaging";
import { extensions } from "sdk/extensions";
import { dao as daoApi } from "sdk/db";

export interface CarEntity {
    readonly Id: number;
    CarModel?: number;
    PlateNumber: string;
}

export interface CarCreateEntity {
    readonly CarModel?: number;
    readonly PlateNumber: string;
}

export interface CarUpdateEntity extends CarCreateEntity {
    readonly Id: number;
}

export interface CarEntityOptions {
    $filter?: {
        equals?: {
            Id?: number | number[];
            CarModel?: number | number[];
            PlateNumber?: string | string[];
        };
        notEquals?: {
            Id?: number | number[];
            CarModel?: number | number[];
            PlateNumber?: string | string[];
        };
        contains?: {
            Id?: number;
            CarModel?: number;
            PlateNumber?: string;
        };
        greaterThan?: {
            Id?: number;
            CarModel?: number;
            PlateNumber?: string;
        };
        greaterThanOrEqual?: {
            Id?: number;
            CarModel?: number;
            PlateNumber?: string;
        };
        lessThan?: {
            Id?: number;
            CarModel?: number;
            PlateNumber?: string;
        };
        lessThanOrEqual?: {
            Id?: number;
            CarModel?: number;
            PlateNumber?: string;
        };
    },
    $select?: (keyof CarEntity)[],
    $sort?: string | (keyof CarEntity)[],
    $order?: 'asc' | 'desc',
    $offset?: number,
    $limit?: number,
}

interface CarEntityEvent {
    readonly operation: 'create' | 'update' | 'delete';
    readonly table: string;
    readonly entity: Partial<CarEntity>;
    readonly key: {
        name: string;
        column: string;
        value: number;
    }
}

export class CarRepository {

    private static readonly DEFINITION = {
        table: "CODBEX_CAR",
        properties: [
            {
                name: "Id",
                column: "CAR_ID",
                type: "INTEGER",
                id: true,
                autoIncrement: true,
            },
            {
                name: "CarModel",
                column: "CAR_CARMODEL",
                type: "INTEGER",
            },
            {
                name: "PlateNumber",
                column: "CAR_PLATENUMBER",
                type: "VARCHAR",
                required: true
            }
        ]
    };

    private readonly dao;

    constructor(dataSource = "DefaultDB") {
        this.dao = daoApi.create(CarRepository.DEFINITION, null, dataSource);
    }

    public findAll(options?: CarEntityOptions): CarEntity[] {
        return this.dao.list(options);
    }

    public findById(id: number): CarEntity | undefined {
        const entity = this.dao.find(id);
        return entity ?? undefined;
    }

    public create(entity: CarCreateEntity): number {
        const id = this.dao.insert(entity);
        this.triggerEvent({
            operation: "create",
            table: "CODBEX_CAR",
            entity: entity,
            key: {
                name: "Id",
                column: "CAR_ID",
                value: id
            }
        });
        return id;
    }

    public update(entity: CarUpdateEntity): void {
        this.dao.update(entity);
        this.triggerEvent({
            operation: "update",
            table: "CODBEX_CAR",
            entity: entity,
            key: {
                name: "Id",
                column: "CAR_ID",
                value: entity.Id
            }
        });
    }

    public upsert(entity: CarCreateEntity | CarUpdateEntity): number {
        const id = (entity as CarUpdateEntity).Id;
        if (!id) {
            return this.create(entity);
        }

        const existingEntity = this.findById(id);
        if (existingEntity) {
            this.update(entity as CarUpdateEntity);
            return id;
        } else {
            return this.create(entity);
        }
    }

    public deleteById(id: number): void {
        const entity = this.dao.find(id);
        this.dao.remove(id);
        this.triggerEvent({
            operation: "delete",
            table: "CODBEX_CAR",
            entity: entity,
            key: {
                name: "Id",
                column: "CAR_ID",
                value: id
            }
        });
    }

    public count(options?: CarEntityOptions): number {
        return this.dao.count(options);
    }

    public customDataCount(): number {
        const resultSet = query.execute('SELECT COUNT(*) AS COUNT FROM "CODBEX_CAR"');
        if (resultSet !== null && resultSet[0] !== null) {
            if (resultSet[0].COUNT !== undefined && resultSet[0].COUNT !== null) {
                return resultSet[0].COUNT;
            } else if (resultSet[0].count !== undefined && resultSet[0].count !== null) {
                return resultSet[0].count;
            }
        }
        return 0;
    }

    private async triggerEvent(data: CarEntityEvent) {
        const triggerExtensions = await extensions.loadExtensionModules("codbex-cars-Car-Car", ["trigger"]);
        triggerExtensions.forEach(triggerExtension => {
            try {
                triggerExtension.trigger(data);
            } catch (error) {
                console.error(error);
            }            
        });
        producer.topic("codbex-cars-Car-Car").send(JSON.stringify(data));
    }
}
