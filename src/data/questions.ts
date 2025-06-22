import { Question } from '../types';

export const questions: Question[] = [
  // Complex Numbers
  { number: '3 + 4i', correctCategory: 'complex' },
  { number: '-2 + 5i', correctCategory: 'complex' },
  { number: '1 - 3i', correctCategory: 'complex' },
  { number: '-4 - 2i', correctCategory: 'complex' },
  { number: '-1 + 6i', correctCategory: 'complex' },
  { number: '5 - 4i', correctCategory: 'complex' },

  // Imaginary Numbers
  { number: '2i', correctCategory: 'imaginary' },
  { number: '-3i', correctCategory: 'imaginary' },
  { number: '5i', correctCategory: 'imaginary' },
  { number: '-7i', correctCategory: 'imaginary' },
  { number: '4i', correctCategory: 'imaginary' },
  { number: '-6i', correctCategory: 'imaginary' },

  // Rational Numbers
  { number: '1/2', correctCategory: 'rational' },
  { number: '-3/4', correctCategory: 'rational' },
  { number: '-5/6', correctCategory: 'rational' },
  { number: '√0.09', correctCategory: 'rational' },
  { number: '-9/10', correctCategory: 'rational' },
  { number: '-13/14', correctCategory: 'rational' },


  // Irrational Numbers
  { number: 'π', correctCategory: 'irrational' },
  { number: '√2', correctCategory: 'irrational' },
  { number: '√5', correctCategory: 'irrational' },
  { number: '√23', correctCategory: 'irrational' },
  { number: 'e', correctCategory: 'irrational' },
  { number: '2π', correctCategory: 'irrational' },



  // Integers
  { number: '-10', correctCategory: 'integer' },
  { number: '-8', correctCategory: 'integer' },
  { number: '-6', correctCategory: 'integer' },
  { number: '-4', correctCategory: 'integer' },
  { number: '-2', correctCategory: 'integer' },
  { number: '-√36', correctCategory: 'integer' },



  // Whole Numbers
  { number: '0', correctCategory: 'whole' },

  // Natural Numbers
  { number: '1', correctCategory: 'natural' },
  { number: '21', correctCategory: 'natural' },
  { number: '9', correctCategory: 'natural' },
  { number: '101', correctCategory: 'natural' },
  { number: '12', correctCategory: 'natural' },
  { number: '√25', correctCategory: 'natural' },

]; 