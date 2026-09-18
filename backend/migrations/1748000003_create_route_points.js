exports.shorthands = undefined;

exports.up = pgm => {
    pgm.createTable('route_points', {
        id: {type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()')},
        ride_id: {type: 'uuid', notNull: true, references: '"rides"'},
        location: {type: 'geography(POINT, 4326)', notNull: true},
        recorded_at: {type: 'timestamp', notNull: true},
        sequence_number: {type: 'integer', notNull: true},
    })
}

exports.down = pgm => {
    pgm.dropTable('route_points')
}