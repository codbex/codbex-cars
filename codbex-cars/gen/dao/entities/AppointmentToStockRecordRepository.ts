import { query } from "sdk/db";
import { producer } from "sdk/messaging";
import { extensions } from "sdk/extensions";
import { dao as daoApi } from "sdk/db";

export interface AppointmentToStockRecordEntity {
    readonly Id: number;
    Appointment?: number;
    StockRecord?: number;
    PurchaseOrder?: number;
}

export interface AppointmentToStockRecordCreateEntity {
    readonly Appointment?: number;
    readonly StockRecord?: number;
    readonly PurchaseOrder?: number;
}

export interface AppointmentToStockRecordUpdateEntity extends AppointmentToStockRecordCreateEntity {
    readonly Id: number;
}

export interface AppointmentToStockRecordEntityOptions {
    $filter?: {
        equals?: {
            Id?: number | number[];
            Appointment?: number | number[];
            StockRecord?: number | number[];
            PurchaseOrder?: number | number[];
        };
        notEquals?: {
            Id?: number | number[];
            Appointment?: number | number[];
            StockRecord?: number | number[];
            PurchaseOrder?: number | number[];
        };
        contains?: {
            Id?: number;
            Appointment?: number;
            StockRecord?: number;
            PurchaseOrder?: number;
        };
        greaterThan?: {
            Id?: number;
            Appointment?: number;
            StockRecord?: number;
            PurchaseOrder?: number;
        };
        greaterThanOrEqual?: {
            Id?: number;
            Appointment?: number;
            StockRecord?: number;
            PurchaseOrder?: number;
        };
        lessThan?: {
            Id?: number;
            Appointment?: number;
            StockRecord?: number;
            PurchaseOrder?: number;
        };
        lessThanOrEqual?: {
            Id?: number;
            Appointment?: number;
            StockRecord?: number;
            PurchaseOrder?: number;
        };
    },
    $select?: (keyof AppointmentToStockRecordEntity)[],
    $sort?: string | (keyof AppointmentToStockRecordEntity)[],
    $order?: 'asc' | 'desc',
    $offset?: number,
    $limit?: number,
}

interface AppointmentToStockRecordEntityEvent {
    readonly operation: 'create' | 'update' | 'delete';
    readonly table: string;
    readonly entity: Partial<AppointmentToStockRecordEntity>;
    readonly key: {
        name: string;
        column: string;
        value: number;
    }
}

export class AppointmentToStockRecordRepository {

    private static readonly DEFINITION = {
        table: "CODBEX_APPOINTMENTTOSTOCKRECORD",
        properties: [
            {
                name: "Id",
                column: "APPOINTMENTTOSTOCKRECORD_ID",
                type: "INTEGER",
                id: true,
                autoIncrement: true,
            },
            {
                name: "Appointment",
                column: "APPOINTMENTTOSTOCKRECORD_APPOINTMENT",
                type: "INTEGER",
            },
            {
                name: "StockRecord",
                column: "APPOINTMENTTOSTOCKRECORD_STOCKRECORD",
                type: "INTEGER",
            },
            {
                name: "PurchaseOrder",
                column: "APPOINTMENTTOSTOCKRECORD_PURCHASEORDER",
                type: "INTEGER",
            }
        ]
    };

    private readonly dao;

    constructor(dataSource = "DefaultDB") {
        this.dao = daoApi.create(AppointmentToStockRecordRepository.DEFINITION, null, dataSource);
    }

    public findAll(options?: AppointmentToStockRecordEntityOptions): AppointmentToStockRecordEntity[] {
        return this.dao.list(options);
    }

    public findById(id: number): AppointmentToStockRecordEntity | undefined {
        const entity = this.dao.find(id);
        return entity ?? undefined;
    }

    public create(entity: AppointmentToStockRecordCreateEntity): number {
        const id = this.dao.insert(entity);
        this.triggerEvent({
            operation: "create",
            table: "CODBEX_APPOINTMENTTOSTOCKRECORD",
            entity: entity,
            key: {
                name: "Id",
                column: "APPOINTMENTTOSTOCKRECORD_ID",
                value: id
            }
        });
        return id;
    }

    public update(entity: AppointmentToStockRecordUpdateEntity): void {
        this.dao.update(entity);
        this.triggerEvent({
            operation: "update",
            table: "CODBEX_APPOINTMENTTOSTOCKRECORD",
            entity: entity,
            key: {
                name: "Id",
                column: "APPOINTMENTTOSTOCKRECORD_ID",
                value: entity.Id
            }
        });
    }

    public upsert(entity: AppointmentToStockRecordCreateEntity | AppointmentToStockRecordUpdateEntity): number {
        const id = (entity as AppointmentToStockRecordUpdateEntity).Id;
        if (!id) {
            return this.create(entity);
        }

        const existingEntity = this.findById(id);
        if (existingEntity) {
            this.update(entity as AppointmentToStockRecordUpdateEntity);
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
            table: "CODBEX_APPOINTMENTTOSTOCKRECORD",
            entity: entity,
            key: {
                name: "Id",
                column: "APPOINTMENTTOSTOCKRECORD_ID",
                value: id
            }
        });
    }

    public count(options?: AppointmentToStockRecordEntityOptions): number {
        return this.dao.count(options);
    }

    public customDataCount(): number {
        const resultSet = query.execute('SELECT COUNT(*) AS COUNT FROM "CODBEX_APPOINTMENTTOSTOCKRECORD"');
        if (resultSet !== null && resultSet[0] !== null) {
            if (resultSet[0].COUNT !== undefined && resultSet[0].COUNT !== null) {
                return resultSet[0].COUNT;
            } else if (resultSet[0].count !== undefined && resultSet[0].count !== null) {
                return resultSet[0].count;
            }
        }
        return 0;
    }

    private async triggerEvent(data: AppointmentToStockRecordEntityEvent) {
        const triggerExtensions = await extensions.loadExtensionModules("codbex-cars-entities-AppointmentToStockRecord", ["trigger"]);
        triggerExtensions.forEach(triggerExtension => {
            try {
                triggerExtension.trigger(data);
            } catch (error) {
                console.error(error);
            }            
        });
        producer.topic("codbex-cars-entities-AppointmentToStockRecord").send(JSON.stringify(data));
    }
}
