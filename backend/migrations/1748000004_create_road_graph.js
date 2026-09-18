exports.shorthands = undefined;

exports.up = pgm => {
    pgm.createTable('road_graph', {
        id: {type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()')},
        osm_id: {type: 'varchar(255)'},
        name: {type: 'varchar(255)'},
        geometry: {type: 'geography(LINESTRING, 4326)', notNull: true},
        length_meters: {type: 'float'},
    })
}

exports.down = pgm => {
    pgm.dropTable('road_graph')
}