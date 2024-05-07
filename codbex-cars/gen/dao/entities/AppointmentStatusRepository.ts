import { query } from "sdk/db";
import { producer } from "sdk/messaging";
import { extensions } from "sdk/extensions";
import { dao as daoApi } from "sdk/db";

export interface AppointmentStatusEntity {
    readonly Id: number;
    Name?: string;
}

export interface AppointmentStatusCreateEntity {
    readonly Name?: string;
}

export interface AppointmentStatusUpdateEntity extends AppointmentStatusCreateEntity {
    readonly Id: number;
}

export interface AppointmentStatusEntityOptions {
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
    $select?: (keyof AppointmentStatusEntity)[],
    $sort?: string | (keyof AppointmentStatusEntity)[],
    $order?: 'asc' | 'desc',
    $offset?: number,
    $limit?: number,
}

interface AppointmentStatusEntityEvent {
    readonly operation: 'create' | 'update' | 'delete';
    readonly table: string;
    readonly entity: Partial<AppointmentStatusEntity>;
    readonly key: {
        name: string;
        column: string;
        value: number;
    }
}

export class AppointmentStatusRepository {

    private static readonly DEFINITION = {
        table: "CODBEX_APPOINTMENTSTATUS",
        properties: [
            {
                name: "Id",
                column: "APPOINTMENTSTATUS_ID",
                type: "INTEGER",
                id: true,
                autoIncrement: true,
            },
            {
                name: "Name",
                column: "APPOINTMENTSTATUS_NAME",
                type: "VARCHAR",
            }
        ]
    };

    private readonly dao;

    constructor(dataSource = "DefaultDB") {
        this.dao = daoApi.create(AppointmentStatusRepository.DEFINITION, null, dataSource);
    }

    public findAll(options?: AppointmentStatusEntityOptions): AppointmentStatusEntity[] {
        return this.dao.list(options);
    }

    public findById(id: number): AppointmentStatusEntity | undefined {
        const entity = this.dao.find(id);
        return entity ?? undefined;
    }

    public create(entity: AppointmentStatusCreateEntity): number {
        const id = this.dao.insert(entity);
        this.triggerEvent({
            operation: "create",
            table: "CODBEX_APPOINTMENTSTATUS",
            entity: entity,
            key: {
                name: "Id",
                column: "APPOINTMENTSTATUS_ID",
                value: id
            }
        });
        return id;
    }

    public update(entity: AppointmentStatusUpdateEntity): void {
        this.dao.update(entity);
        this.triggerEvent({
            operation: "update",
            table: "CODBEX_APPOINTMENTSTATUS",
            entity: entity,
            key: {
                name: "Id",
                column: "APPOINTMENTSTATUS_ID",
                value: entity.Id
            }
        });
    }

    public upsert(entity: AppointmentStatusCreateEntity | AppointmentStatusUpdateEntity): number {
        const id = (entity as AppointmentStatusUpdateEntity).Id;
        if (!id) {
            return this.create(entity);
        }

        const existingEntity = this.findById(id);
        if (existingEntity) {
            this.update(entity as AppointmentStatusUpdateEntity);
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
            table: "CODBEX_APPOINTMENTSTATUS",
            entity: entity,
            key: {
                name: "Id",
                column: "APPOINTMENTSTATUS_ID",
                value: id
            }
        });
    }

    public count(options?: AppointmentStatusEntityOptions): number {
        return this.dao.count(options);
    }

    public customDataCount(): number {
        const resultSet = query.execute('SELECT COUNT(*) AS COUNT FROM "CODBEX_APPOINTMENTSTATUS"');
        if (resultSet !== null && resultSet[0] !== null) {
            if (resultSet[0].COUNT !== undefined && resultSet[0].COUNT !== null) {
                return resultSet[0].COUNT;
            } else if (resultSet[0].count !== undefined && resultSet[0].count !== null) {
                return resultSet[0].count;
            }
        }
        return 0;
    }

    private async triggerEvent(data: AppointmentStatusEntityEvent) {
        const triggerExtensions = await extensions.loadExtensionModules("codbex-cars-entities-AppointmentStatus", ["trigger"]);
        triggerExtensions.forEach(triggerExtension => {
            try {
                triggerExtension.trigger(data);
            } catch (error) {
                console.error(error);
            }            
        });
        producer.topic("codbex-cars-entities-AppointmentStatus").send(JSON.stringify(data));
    }
}
