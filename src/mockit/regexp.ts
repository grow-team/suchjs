import { ParamsRegexp } from '@/config';
import RegexpParser from '@/helpers/regexp';
import { typeOf } from '@/helpers/utils';
import { NormalObject } from '@/types';
import Mockit, { ModifierFn } from './namespace';
export default class ToRegexp extends Mockit<string> {
  private instance: RegexpParser;
  constructor() {
    super();
  }
  public init() {
    // regexp rule
    this.addRule('Regexp', (Regexp: ParamsRegexp) => {
      //
      const { rule } = Regexp;
      try {
        this.instance = new RegexpParser(rule);
      } catch(e) {
        throw e;
      }
    });
    // config rule
    this.addRule('Config', (Config: NormalObject) => {
      //
      const result: NormalObject = {};
      const rule = /.?\\|/g;
      Object.keys(Config).forEach((key) => {
        const value = Config[key];
        if(typeof value === 'string') {

        } else {
          result[key] = value;
        }
      });
      return result;
    });
  }
  public generate() {
    let { instance } = this;
    const { Config, Regexp } = this.params;
    if(!instance) {
      instance = this.instance = new RegexpParser(Regexp.rule, {
        namedGroupConf: Config,
      });
    }
    return instance.build();
  }
  public test() {
    return true;
  }
}
