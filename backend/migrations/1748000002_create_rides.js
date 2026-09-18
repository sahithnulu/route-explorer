exports.shorthands = undefined;

exports.up = pgm => {
    pgm.createTable('rides', {
        id : {type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()')},
        user_id: {type: 'uuid', notNull: true, references: '"users"'},
        started_at: {type: 'timestamp', notNull: true},
        ended_at: {type: 'timestamp'},
        distance_meters: {type: 'float'},
        duration_seconds: {type: 'integer'},
        status: {type: 'varchar(20)', notNull: true, default: 'active'},
    })
}

exports.down = pgm => {
    pgm.dropTable('rides')
}