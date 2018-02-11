/* eslint no-undef: 0 */

import fs from 'fs';

import {
  BamjuConfig,
  defaultConfig,
} from '../../app/common/bamju_config';

const configPath = '/tmp/test/bamju_config.json';
let config;
beforeEach(() => {
  const configJSON = Object.assign(defaultConfig, {
    repositories: [
      {
        repositoryName: 'test',
        absolutePath: '/tmp/bamju/test'
      }
    ],
    config: {
      followChange: false,
      mkdirP: false
    },
  });

  try {
    fs.statSync('/tmp/test');
  } catch (_) {
    fs.mkdirSync('/tmp/test');
  }

  fs.writeFileSync(configPath, JSON.stringify(configJSON));

  config = new BamjuConfig(configPath);
});

describe('BamjuConfig', () => {
  describe('constructor', () => {
    it('Configを読みこめる', () => {
      config = new BamjuConfig(configPath);

      expect(config.getConfig()).toMatchObject({
        config: {
          followChange: false,
          mkdirP: false,
        }
      });
    });

    it('ファイルが存在しない場合は作成する', () => {
      fs.unlinkSync(configPath);
      config = new BamjuConfig(configPath);

      expect(config.getConfig()).toMatchObject(defaultConfig);
    });
  });

  describe('quit', () => {
    it('ファイルを更新する', async () => {
      let jsonString = fs.readFileSync(configPath, 'utf8');
      expect(jsonString).not.toBe(config.toJSON());

      await config.update({
        config: {
          followChange: false
        }
      });
      await config.quit();
      jsonString = fs.readFileSync(configPath, 'utf8');

      expect(jsonString).toBe(config.toJSON());
    });

    it('ファイルが存在しない場合は作成する', async () => {
      fs.unlinkSync(configPath);

      await config.quit();
      const jsonString = fs.readFileSync(configPath, 'utf8');

      expect(jsonString).toBe(config.toJSON());
    });
  });

  describe('update', () => {
    it('ファイルを更新する', async () => {
      let jsonString = fs.readFileSync(configPath, 'utf8');
      expect(jsonString).not.toBe(config.toJSON());

      await config.update({
        config: {
          followChange: false
        }
      });
      jsonString = fs.readFileSync(configPath, 'utf8');

      expect(jsonString).toBe(config.toJSON());
    });

    it('ファイルが存在しない場合は作成する', async () => {
      fs.unlinkSync(configPath);

      await config.update();
      const jsonString = fs.readFileSync(configPath, 'utf8');

      expect(jsonString).toBe(config.toJSON());
    });

    it('quitしたあとは更新しない', async () => {
      await config.quit();
      const beforeJSON = config.toJSON();
      await config.update({
        config: {
          followChange: false
        }
      });
      const jsonString = fs.readFileSync(configPath, 'utf8');

      expect(config.toJSON()).toBe(beforeJSON);
      expect(jsonString).toBe(beforeJSON);
    });
  });

  describe('addWindowConfig', () => {
    it('Windowの追加ができる', async () => {
      const windowConfig = {
        id: 'foo',
        rectangle: {},
        tabs: []
      };
      await config.addWindow(windowConfig);

      expect(config.getConfig().windows.length).toBe(2);
      expect(config.getConfig().windows[1]).toMatchObject(windowConfig);
    });

    it('すでにWindowが存在している場合は何もしない', async () => {
      const windowConfig = {
        id: 'foo',
        rectangle: {},
        tabs: []
      };
      await config.addWindow(windowConfig);

      expect(config.getConfig().windows.length).toBe(2);
      expect(config.getConfig().windows[1]).toMatchObject(windowConfig);

      await config.addWindow(windowConfig);

      expect(config.getConfig().windows.length).toBe(2);
      expect(config.getConfig().windows[1]).toMatchObject(windowConfig);
    });
  });

  describe('replaceWindowConfig', () => {
    it('Windowの変更ができる', async () => {
      const windowConfig = {
        id: 'foo',
        rectangle: {},
        tabs: []
      };
      await config.addWindow(windowConfig);

      const newConfig = Object.assign({}, windowConfig, {
        tabs: [
          {
            content: 'hogehoge'
          }
        ]
      });

      config.replaceWindow(newConfig);

      expect(config.getConfig().windows.length).toBe(2);
      expect(config.getConfig().windows[1]).toMatchObject(newConfig);
    });

    it('Windowが存在しない場合は追加する', async () => {
      const windowConfig = {
        id: 'foo',
        rectangle: {},
        tabs: []
      };
      await config.replaceWindow(windowConfig);

      expect(config.getConfig().windows.length).toBe(2);
      expect(config.getConfig().windows[1]).toMatchObject(windowConfig);
    });
  });

  describe('removeWindow', () => {
    it('Windowの削除ができる', async () => {
      const windowConfig = {
        id: 'foo',
        rectangle: {},
        tabs: []
      };
      await config.addWindow(windowConfig);

      expect(config.getConfig().windows.length).toBe(2);

      await config.removeWindow('foo');

      expect(config.getConfig().windows.length).toBe(1);
    });

    it('Windowが存在しない場合は何もしない', async () => {
      expect(config.getConfig().windows.length).toBe(1);

      await config.removeWindow('bar');

      expect(config.getConfig().windows.length).toBe(1);
    });
  });

  describe('addRepository', () => {
    it('Repositoryの追加ができる', async () => {
      const repositoryConfig = {
        repositoryName: 'foo',
        absolutePath: '/tmp/bamju/foo'
      };
      await config.addRepository(repositoryConfig);

      expect(config.getConfig().repositories.length).toBe(2);
      expect(config.getConfig().repositories[1]).toMatchObject(repositoryConfig);
    });

    it('すでにWindowが存在している場合は何もしない', async () => {
      const repositoryConfig = {
        repositoryName: 'foo',
        absolutePath: '/tmp/bamju/foo'
      };
      await config.addRepository(repositoryConfig);

      expect(config.getConfig().repositories.length).toBe(2);
      expect(config.getConfig().repositories[1]).toMatchObject(repositoryConfig);

      await config.addRepository(repositoryConfig);

      expect(config.getConfig().repositories.length).toBe(2);
      expect(config.getConfig().repositories[1]).toMatchObject(repositoryConfig);
    });
  });

  describe('removeRepository', () => {
    it('Repositoryの削除ができる', async () => {
      const repositoryConfig = {
        absolutePath: '/tmp/bamju/test',
        repositoryName: 'test'
      };
      await config.addRepository(repositoryConfig);

      expect(config.getConfig().repositories.length).toBe(1);

      await config.removeRepository(repositoryConfig.repositoryName, repositoryConfig.absolutePath);

      expect(config.getConfig().repositories.length).toBe(0);
    });

    it('repositoryNameが存在しない場合は何もしない', async () => {
      expect(config.getConfig().repositories.length).toBe(1);

      await config.removeRepository('bar', '/tmp/bamju/bar');

      expect(config.getConfig().repositories.length).toBe(1);
    });
  });
});
