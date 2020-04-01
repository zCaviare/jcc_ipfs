const jingtum = require('@utils/jingtum');
const ipfs = require('@utils/ipfs');
const getPath = require('@utils/path').getPath;
const MD5 = require('blueimp-md5');

module.exports = {
  friendlyName: 'Write',

  description: 'Write a file or directory to ipfs.',

  inputs: {
    data: {
      description: '所要上传数据',
      type: 'string',
      required: true
    },
    md5: {
      description: '上传数据md5',
      type: 'string',
      required: true
    },
    size: {
      description: '文件大小',
      type: 'number',
      required: true
    },
    name: {
      description: '文件名称',
      type: 'string',
      required: true
    },
    sign: {
      description: '签名',
      type: 'string',
      required: true
    },
    timestamp: {
      description: '时间戳',
      type: 'number',
      required: true
    },
    publickey: {
      description: '公钥',
      type: 'string',
      required: true
    }
  },

  exits: {},

  async fn({ data, md5, size, name, sign, timestamp, publickey }) {
    try {
      if (MD5(data) !== md5) {
        return {
          success: false,
          msg: 'md5不匹配'
        };
      }

      if (!jingtum.verify(md5 + size + name + timestamp, sign, publickey)) {
        return {
          success: false,
          msg: '签名信息不匹配'
        };
      }

      const path = getPath(jingtum.toAddress(publickey), name);

      // 向ipfs写文件
      await ipfs.files.write(
        path,
        Buffer.from(
          JSON.stringify({
            data,
            md5,
            size,
            name,
            sign,
            timestamp,
            publickey,
            // 保存写入文件路径
            path
          })
        ),
        {
          truncate: true,
          parents: true,
          mode: '+rw',
          create: true
        }
      );

      // 获取stat
      const stat = await ipfs.files.stat(path);
      return {
        success: true,
        result: [
          {
            transaction: stat.cid.toString()
          }
        ]
      };
    } catch (error) {
      sails.log(error);
      return {
        success: false,
        msg: error.message
      };
    }
  }
};
