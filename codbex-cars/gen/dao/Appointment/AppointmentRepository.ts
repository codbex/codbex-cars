import { query } from "sdk/db";
import { producer } from "sdk/messaging";
import { extensions } from "sdk/extensions";
import { dao as daoApi } from "sdk/db";
import { EntityUtils } from "../utils/EntityUtils";

export interface AppointmentEntity {
    readonly Id: number;
    Operator?: number;
    Assigee?: number;
    Car?: number;
    AppointmentStatus?: number;
    SalesOrder?: number;
    IntakeDate?: Date;
    ReleaseDate?: Date;
    Issue?: string;
    Customer?: number;
}

export interface AppointmentCreateEntity {
    readonly Operator?: number;
    readonly Assigee?: number;
    readonly Car?: number;
    readonly AppointmentStatus?: number;
    readonly SalesOrder?: number;
    readonly IntakeDate?: Date;
    readonly ReleaseDate?: Date;
    readonly Issue?: string;
    readonly Customer?: number;
}

export interface AppointmentUpdateEntity extends AppointmentCreateEntity {
    readonly Id: number;
}

export interface AppointmentEntityOptions {
    $filter?: {
        equals?: {
            Id?: number | number[];
            Operator?: number | number[];
            Assigee?: number | number[];
            Car?: number | number[];
            AppointmentStatus?: number | number[];
            SalesOrder?: number | number[];
            IntakeDate?: Date | Date[];
            ReleaseDate?: Date | Date[];
            Issue?: string | string[];
            Customer?: number | number[];
        };
        notEquals?: {
            Id?: number | number[];
            Operator?: number | number[];
            Assigee?: number | number[];
            Car?: number | number[];
            AppointmentStatus?: number | number[];
            SalesOrder?: number | number[];
            IntakeDate?: Date | Date[];
            ReleaseDate?: Date | Date[];
            Issue?: string | string[];
            Customer?: number | number[];
        };
        contains?: {
            Id?: number;
            Operator?: number;
            Assigee?: number;
            Car?: number;
            AppointmentStatus?: number;
            SalesOrder?: number;
            IntakeDate?: Date;
            ReleaseDate?: Date;
            Issue?: string;
            Customer?: number;
        };
        greaterThan?: {
            Id?: number;
            Operator?: number;
            Assigee?: number;
            Car?: number;
            AppointmentStatus?: number;
            SalesOrder?: number;
            IntakeDate?: Date;
            ReleaseDate?: Date;
            Issue?: string;
            Customer?: number;
        };
        greaterThanOrEqual?: {
            Id?: number;
            Operator?: number;
            Assigee?: number;
            Car?: number;
            AppointmentStatus?: number;
            SalesOrder?: number;
            IntakeDate?: Date;
            ReleaseDate?: Date;
            Issue?: string;
            Customer?: number;
        };
        lessThan?: {
            Id?: number;
            Operator?: number;
            Assigee?: number;
            Car?: number;
            AppointmentStatus?: number;
            SalesOrder?: number;
            IntakeDate?: Date;
            ReleaseDate?: Date;
            Issue?: string;
            Customer?: number;
        };
        lessThanOrEqual?: {
            Id?: number;
            Operator?: number;
            Assigee?: number;
            Car?: number;
            AppointmentStatus?: number;
            SalesOrder?: number;
            IntakeDate?: Date;
            ReleaseDate?: Date;
            Issue?: string;
            Customer?: number;
        };
    },
    $select?: (keyof AppointmentEntity)[],
    $sort?: string | (keyof AppointmentEntity)[],
    $order?: 'asc' | 'desc',
    $offset?: number,
    $limit?: number,
}

interface AppointmentEntityEvent {
    readonly operation: 'create' | 'update' | 'delete';
    readonly table: string;
    readonly entity: Partial<AppointmentEntity>;
    readonly key: {
        name: string;
        column: string;
        value: number;
    }
}

export class AppointmentRepository {

    private static readonly DEFINITION = {
        table: "CODBEX_APPOINTMENT",
        properties: [
            {
                name: "Id",
                column: "APPOINTMENT_ID",
                type: "INTEGER",
                id: true,
                autoIncrement: true,
            },
            {
                name: "Operator",
                column: "APPOINTMENT_OPERATOR",
                type: "INTEGER",
            },
            {
                name: "Assigee",
                column: "APPOINTMENT_ASSIGEE",
                type: "INTEGER",
            },
            {
                name: "Car",
                column: "APPOINTMENT_CAR",
                type: "INTEGER",
            },
            {
                name: "AppointmentStatus",
                column: "APPOINTMENT_APPOINTMENTSTATUS",
                type: "INTEGER",
            },
            {
                name: "SalesOrder",
                column: "APPOINTMENT_SALESORDER",
                type: "INTEGER",
            },
            {
                name: "IntakeDate",
                column: "APPOINTMENT_INTAKEDATE",
                type: "DATE",
            },
            {
                name: "ReleaseDate",
                column: "APPOINTMENT_RELEASEDATE",
                type: "DATE",
            },
            {
                name: "Issue",
                column: "APPOINTMENT_ISSUE",
                type: "VARCHAR",
            },
            {
                name: "Customer",
                column: "APPOINTMENT_CUSTOMER",
                type: "INTEGER",
            }
        ]
    };

    private readonly dao;

    constructor(dataSource = "DefaultDB") {
        this.dao = daoApi.create(AppointmentRepository.DEFINITION, null, dataSource);
    }

    public findAll(options?: AppointmentEntityOptions): AppointmentEntity[] {
        return this.dao.list(options).map((e: AppointmentEntity) => {
            EntityUtils.setDate(e, "IntakeDate");
            EntityUtils.setDate(e, "ReleaseDate");
            return e;
        });
    }

    public findById(id: number): AppointmentEntity | undefined {
        const entity = this.dao.find(id);
        EntityUtils.setDate(entity, "IntakeDate");
        EntityUtils.setDate(entity, "ReleaseDate");
        return entity ?? undefined;
    }

    public create(entity: AppointmentCreateEntity): number {
        EntityUtils.setLocalDate(entity, "IntakeDate");
        EntityUtils.setLocalDate(entity, "ReleaseDate");
        const id = this.dao.insert(entity);
        this.triggerEvent({
            operation: "create",
            table: "CODBEX_APPOINTMENT",
            entity: entity,
            key: {
                name: "Id",
                column: "APPOINTMENT_ID",
                value: id
            }
        });
        return id;
    }

    public update(entity: AppointmentUpdateEntity): void {
        // EntityUtils.setLocalDate(entity, "IntakeDate");
        // EntityUtils.setLocalDate(entity, "ReleaseDate");
        this.dao.update(entity);
        this.triggerEvent({
            operation: "update",
            table: "CODBEX_APPOINTMENT",
            entity: entity,
            key: {
                name: "Id",
                column: "APPOINTMENT_ID",
                value: entity.Id
            }
        });
    }

    public upsert(entity: AppointmentCreateEntity | AppointmentUpdateEntity): number {
        const id = (entity as AppointmentUpdateEntity).Id;
        if (!id) {
            return this.create(entity);
        }

        const existingEntity = this.findById(id);
        if (existingEntity) {
            this.update(entity as AppointmentUpdateEntity);
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
            table: "CODBEX_APPOINTMENT",
            entity: entity,
            key: {
                name: "Id",
                column: "APPOINTMENT_ID",
                value: id
            }
        });
    }

    public count(options?: AppointmentEntityOptions): number {
        return this.dao.count(options);
    }

    public customDataCount(): number {
        const resultSet = query.execute('SELECT COUNT(*) AS COUNT FROM "CODBEX_APPOINTMENT"');
        if (resultSet !== null && resultSet[0] !== null) {
            if (resultSet[0].COUNT !== undefined && resultSet[0].COUNT !== null) {
                return resultSet[0].COUNT;
            } else if (resultSet[0].count !== undefined && resultSet[0].count !== null) {
                return resultSet[0].count;
            }
        }
        return 0;
    }

    private async triggerEvent(data: AppointmentEntityEvent) {
        const triggerExtensions = await extensions.loadExtensionModules("codbex-cars-Appointment-Appointment", ["trigger"]);
        triggerExtensions.forEach(triggerExtension => {
            try {
                triggerExtension.trigger(data);
            } catch (error) {
                console.error(error);
            }            
        });
        producer.topic("codbex-cars-Appointment-Appointment").send(JSON.stringify(data));
    }
}
