import dayjs from 'dayjs';
import { MapFnArgs } from '../mapFunctionName';
import commonFns from './commonFns';
import { getWeekdayByText } from '../helpers/formulaFnHelper';

const sqlite3 = {
  ...commonFns,
  LEN: 'LENGTH',
  CEILING(args) {
    return args.knex.raw(
      `round(${args.fn(args.pt.arguments[0])} + 0.5)${args.colAlias}`
    );
  },
  FLOOR(args) {
    return args.knex.raw(
      `round(${args.fn(args.pt.arguments[0])} - 0.5)${args.colAlias}`
    );
  },
  MOD: (args: MapFnArgs) => {
    return args.fn({
      type: 'BinaryExpression',
      operator: '%',
      left: args.pt.arguments[0],
      right: args.pt.arguments[1],
    });
  },
  REPEAT(args: MapFnArgs) {
    return args.knex.raw(
      `replace(printf('%.' || ${args.fn(
        args.pt.arguments[1]
      )} || 'c', '/'),'/',${args.fn(args.pt.arguments[0])})${args.colAlias}`
    );
  },
  NOW: 'DATE',
  SEARCH: 'INSTR',
  INT(args: MapFnArgs) {
    return args.knex.raw(
      `CAST(${args.fn(args.pt.arguments[0])} as INTEGER)${args.colAlias}`
    );
  },
  LEFT: (args: MapFnArgs) => {
    return args.knex.raw(
      `SUBSTR(${args.fn(args.pt.arguments[0])},1,${args.fn(
        args.pt.arguments[1]
      )})${args.colAlias}`
    );
  },
  RIGHT: (args: MapFnArgs) => {
    return args.knex.raw(
      `SUBSTR(${args.fn(args.pt.arguments[0])},-(${args.fn(
        args.pt.arguments[1]
      )}))${args.colAlias}`
    );
  },
  MID: 'SUBSTR',
  FLOAT: (args: MapFnArgs) => {
    return args.knex
      .raw(`CAST(${args.fn(args.pt.arguments[0])} as FLOAT)${args.colAlias}`)
      .wrap('(', ')');
  },
  DATEADD: ({ fn, knex, pt, colAlias }: MapFnArgs) => {
    const dateIN = fn(pt.arguments[1]);
    return knex.raw(
      `CASE
      WHEN ${fn(pt.arguments[0])} LIKE '%:%' THEN 
        STRFTIME('%Y-%m-%d %H:%M', DATETIME(DATETIME(${fn(
          pt.arguments[0]
        )}, 'localtime'), 
        ${dateIN > 0 ? '+' : ''}${fn(pt.arguments[1])} || ' ${String(
        fn(pt.arguments[2])
      ).replace(/["']/g, '')}'))
      ELSE 
        DATE(DATETIME(${fn(pt.arguments[0])}, 'localtime'), 
        ${dateIN > 0 ? '+' : ''}${fn(pt.arguments[1])} || ' ${String(
        fn(pt.arguments[2])
      ).replace(/["']/g, '')}')
      END${colAlias}`
    );
  },

  WEEKDAY: ({ fn, knex, pt, colAlias }: MapFnArgs) => {
    // strftime('%w', date) - day of week 0 - 6 with Sunday == 0
    // WEEKDAY() returns an index from 0 to 6 for Monday to Sunday
    return knex.raw(
      `(strftime('%w', ${
        pt.arguments[0].type === 'Literal'
          ? `'${dayjs(fn(pt.arguments[0])).format('YYYY-MM-DD')}'`
          : fn(pt.arguments[0])
      }) - 1 - ${getWeekdayByText(
        pt?.arguments[1]?.value
      )} % 7 + 7) % 7 ${colAlias}`
    );
  },
};

export default sqlite3;
