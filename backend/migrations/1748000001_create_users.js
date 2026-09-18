exports.shorthands = undefined;

exports.up = pgm => {
    pgm.createTable('users', {
        id: {type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()')},
        email: {type: 'varchar(255)', notNull: true, unique: true},
        password_hash: {type: 'varchar(255)', notNull: true},
        created_at: {type: 'timestamp', notNull: true, default: pgm.func('current_timestamp')}
    })
}

exports.down = pgm => {
    pgm.dropTable('users')
}