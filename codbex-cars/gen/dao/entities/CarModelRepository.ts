import { query } from "sdk/db";
import { producer } from "sdk/messaging";
import { extensions } from "sdk/extensions";
import { dao as daoApi } from "sdk/db";

export interface CarModelEntity {
    readonly Id: number;
    Manufacturer?: number;
    Model: string;
    Year?: number;
    CarCategory?: number;
}

export interface CarModelCreateEntity {
    readonly Manufacturer?: number;
    readonly Model: string;
    readonly Year?: number;
    readonly CarCategory?: number;
}

export interface CarModelUpdateEntity extends CarModelCreateEntity {
    readonly Id: number;
}

export interface CarModelEntityOptions {
    $filter?: {
        equals?: {
            Id?: number | number[];
            Manufacturer?: number | number[];
            Model?: string | string[];
            Year?: number | number[];
            CarCategory?: number | number[];
        };
        notEquals?: {
            Id?: number | number[];
            Manufacturer?: number | number[];
            Model?: string | string[];
            Year?: number | number[];
            CarCategory?: number | number[];
        };
        contains?: {
            Id?: number;
            Manufacturer?: number;
            Model?: string;
            Year?: number;
            CarCategory?: number;
        };
        greaterThan?: {
            Id?: number;
            Manufacturer?: number;
            Model?: string;
            Year?: number;
            CarCategory?: number;
        };
        greaterThanOrEqual?: {
            Id?: number;
            Manufacturer?: number;
            Model?: string;
            Year?: number;
            CarCategory?: number;
        };
        lessThan?: {
            Id?: number;
            Manufacturer?: number;
            Model?: string;
            Year?: number;
            CarCategory?: number;
        };
        lessThanOrEqual?: {
            Id?: number;
            Manufacturer?: number;
            Model?: string;
            Year?: number;
            CarCategory?: number;
        };
    },
    $select?: (keyof CarModelEntity)[],
    $sort?: string | (keyof CarModelEntity)[],
    $order?: 'asc' | 'desc',
    $offset?: number,
    $limit?: number,
}

interface CarModelEntityEvent {
    readonly operation: 'create' | 'update' | 'delete';
    readonly table: string;
    readonly entity: Partial<CarModelEntity>;
    readonly key: {
        name: string;
        column: string;
        value: number;
    }
}

export class CarModelRepository {

    private static readonly DEFINITION = {
        table: "CODBEX_CARMODEL",
        properties: [
            {
                name: "Id",
                column: "CARMODEL_ID",
                type: "INTEGER",
                id: true,
                autoIncrement: true,
            },
            {
                name: "Manufacturer",
                column: "CARMODEL_MANUFACTURER",
                type: "INTEGER",
            },
            {
                name: "Model",
                column: "CARMODEL_MODEL",
                type: "VARCHAR",
                required: true
            },
            {
                name: "Year",
                column: "CARMODEL_YEAR",
                type: "INTEGER",
            },
            {
                name: "CarCategory",
                column: "CARMODEL_CARCATEGORY",
                type: "INTEGER",
            }
        ]
    };

    private readonly dao;

    constructor(dataSource = "DefaultDB") {
        this.dao = daoApi.create(CarModelRepository.DEFINITION, null, dataSource);
    }

    public findAll(options?: CarModelEntityOptions): CarModelEntity[] {
        return this.dao.list(options);
    }

    public findById(id: number): CarModelEntity | undefined {
        const entity = this.dao.find(id);
        return entity ?? undefined;
    }

    public create(entity: CarModelCreateEntity): number {
        const id = this.dao.insert(entity);
        this.triggerEvent({
            operation: "create",
            table: "CODBEX_CARMODEL",
            entity: entity,
            key: {
                name: "Id",
                column: "CARMODEL_ID",
                value: id
            }
        });
        return id;
    }

    public update(entity: CarModelUpdateEntity): void {
        this.dao.update(entity);
        this.triggerEvent({
            operation: "update",
            table: "CODBEX_CARMODEL",
            entity: entity,
            key: {
                name: "Id",
                column: "CARMODEL_ID",
                value: entity.Id
            }
        });
    }

    public upsert(entity: CarModelCreateEntity | CarModelUpdateEntity): number {
        const id = (entity as CarModelUpdateEntity).Id;
        if (!id) {
            return this.create(entity);
        }

        const existingEntity = this.findById(id);
        if (existingEntity) {
            this.update(entity as CarModelUpdateEntity);
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
            table: "CODBEX_CARMODEL",
            entity: entity,
            key: {
                name: "Id",
                column: "CARMODEL_ID",
                value: id
            }
        });
    }

    public count(options?: CarModelEntityOptions): number {
        return this.dao.count(options);
    }

    public customDataCount(): number {
        const resultSet = query.execute('SELECT COUNT(*) AS COUNT FROM "CODBEX_CARMODEL"');
        if (resultSet !== null && resultSet[0] !== null) {
            if (resultSet[0].COUNT !== undefined && resultSet[0].COUNT !== null) {
                return resultSet[0].COUNT;
            } else if (resultSet[0].count !== undefined && resultSet[0].count !== null) {
                return resultSet[0].count;
            }
        }
        return 0;
    }

    private async triggerEvent(data: CarModelEntityEvent) {
        const triggerExtensions = await extensions.loadExtensionModules("codbex-cars-entities-CarModel", ["trigger"]);
        triggerExtensions.forEach(triggerExtension => {
            try {
                triggerExtension.trigger(data);
            } catch (error) {
                console.error(error);
            }            
        });
        producer.topic("codbex-cars-entities-CarModel").send(JSON.stringify(data));
    }
}
