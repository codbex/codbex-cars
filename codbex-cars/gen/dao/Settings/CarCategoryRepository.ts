import { query } from "sdk/db";
import { producer } from "sdk/messaging";
import { extensions } from "sdk/extensions";
import { dao as daoApi } from "sdk/db";

export interface CarCategoryEntity {
    readonly Id: number;
    Name: string;
}

export interface CarCategoryCreateEntity {
    readonly Name: string;
}

export interface CarCategoryUpdateEntity extends CarCategoryCreateEntity {
    readonly Id: number;
}

export interface CarCategoryEntityOptions {
    $filter?: {
        equals?: {
            Id?: number | number[];
            Name?: string | string[];
        };
        notEquals?: {
            Id?: number | number[];
            Name?: string | string[];
        };
        contains?: {
            Id?: number;
            Name?: string;
        };
        greaterThan?: {
            Id?: number;
            Name?: string;
        };
        greaterThanOrEqual?: {
            Id?: number;
            Name?: string;
        };
        lessThan?: {
            Id?: number;
            Name?: string;
        };
        lessThanOrEqual?: {
            Id?: number;
            Name?: string;
        };
    },
    $select?: (keyof CarCategoryEntity)[],
    $sort?: string | (keyof CarCategoryEntity)[],
    $order?: 'asc' | 'desc',
    $offset?: number,
    $limit?: number,
}

interface CarCategoryEntityEvent {
    readonly operation: 'create' | 'update' | 'delete';
    readonly table: string;
    readonly entity: Partial<CarCategoryEntity>;
    readonly key: {
        name: string;
        column: string;
        value: number;
    }
}

export class CarCategoryRepository {

    private static readonly DEFINITION = {
        table: "CODBEX_CARCATEGORY",
        properties: [
            {
                name: "Id",
                column: "CARCATEGORY_ID",
                type: "INTEGER",
                id: true,
                autoIncrement: true,
            },
            {
                name: "Name",
                column: "CARCATEGORY_NAME",
                type: "VARCHAR",
                required: true
            }
        ]
    };

    private readonly dao;

    constructor(dataSource = "DefaultDB") {
        this.dao = daoApi.create(CarCategoryRepository.DEFINITION, null, dataSource);
    }

    public findAll(options?: CarCategoryEntityOptions): CarCategoryEntity[] {
        return this.dao.list(options);
    }

    public findById(id: number): CarCategoryEntity | undefined {
        const entity = this.dao.find(id);
        return entity ?? undefined;
    }

    public create(entity: CarCategoryCreateEntity): number {
        const id = this.dao.insert(entity);
        this.triggerEvent({
            operation: "create",
            table: "CODBEX_CARCATEGORY",
            entity: entity,
            key: {
                name: "Id",
                column: "CARCATEGORY_ID",
                value: id
            }
        });
        return id;
    }

    public update(entity: CarCategoryUpdateEntity): void {
        this.dao.update(entity);
        this.triggerEvent({
            operation: "update",
            table: "CODBEX_CARCATEGORY",
            entity: entity,
            key: {
                name: "Id",
                column: "CARCATEGORY_ID",
                value: entity.Id
            }
        });
    }

    public upsert(entity: CarCategoryCreateEntity | CarCategoryUpdateEntity): number {
        const id = (entity as CarCategoryUpdateEntity).Id;
        if (!id) {
            return this.create(entity);
        }

        const existingEntity = this.findById(id);
        if (existingEntity) {
            this.update(entity as CarCategoryUpdateEntity);
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
            table: "CODBEX_CARCATEGORY",
            entity: entity,
            key: {
                name: "Id",
                column: "CARCATEGORY_ID",
                value: id
            }
        });
    }

    public count(options?: CarCategoryEntityOptions): number {
        return this.dao.count(options);
    }

    public customDataCount(): number {
        const resultSet = query.execute('SELECT COUNT(*) AS COUNT FROM "CODBEX_CARCATEGORY"');
        if (resultSet !== null && resultSet[0] !== null) {
            if (resultSet[0].COUNT !== undefined && resultSet[0].COUNT !== null) {
                return resultSet[0].COUNT;
            } else if (resultSet[0].count !== undefined && resultSet[0].count !== null) {
                return resultSet[0].count;
            }
        }
        return 0;
    }

    private async triggerEvent(data: CarCategoryEntityEvent) {
        const triggerExtensions = await extensions.loadExtensionModules("codbex-cars-Settings-CarCategory", ["trigger"]);
        triggerExtensions.forEach(triggerExtension => {
            try {
                triggerExtension.trigger(data);
            } catch (error) {
                console.error(error);
            }            
        });
        producer.topic("codbex-cars-Settings-CarCategory").send(JSON.stringify(data));
    }
}
