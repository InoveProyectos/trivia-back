import nock from 'nock';

interface Option {
  index: number;
  content: string;
}

interface Challenge {
  name: string;
  description: string;
  options: Option[];
}

const declareVariable: Challenge = {
  name: "Declarar una variable",
  description: "Selecciona la manera correcta de declarar una variable en python",
  options: [
    {
      "index": 1,
      "content": "int numero = 5"
    },
    {
      "index": 2,
      "content": "numero = 5"
    },
    {
      "index": 3,
      "content": "numero == 5"
    },
    {
      "index": 4,
      "content": "5 = numero"
    }
  ]
}

const variableType: Challenge = {
  name: "Tipos de variables",
  description: "Indica de que tipo es el valor 5.0",
  options: [
    {
      "index": 1,
      "content": "int"
    },
    {
      "index": 2,
      "content": "float"
    },
    {
      "index": 3,
      "content": "str"
    },
    {
      "index": 4,
      "content": "bool"
    }
  ]
}

const desafiosMockVariableType = nock('http://0.0.0.0:8096')
  .get('/api/v1.0/trivias')
  .query({
    id: '0'
  })
  .reply(200, {
    challenge: variableType
  })

const desafiosMockDeclareVariable = nock('http://0.0.0.0:8096')
  .get('/api/v1.0/trivias')
  .query({
    id: '1'
  })
  .reply(200, {
    challenge: declareVariable
  })

export default {
  desafiosMockDeclareVariable,
  desafiosMockVariableType
};