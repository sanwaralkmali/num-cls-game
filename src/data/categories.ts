import { Category } from '../types';

export const categories: Category[] = [
  {
    id: 'complex',
    name: 'Complex Numbers',
    description: 'Numbers in the form a + bi, where a and b are real numbers and i is the imaginary unit'
  },
  {
    id: 'imaginary',
    name: 'Imaginary Numbers',
    description: 'Numbers in the form bi, where b is a real number and i is the imaginary unit'
  },
  {
    id: 'irrational',
    name: 'Irrational Numbers',
    description: 'Numbers that cannot be expressed as a ratio of two integers'
  },
  {
    id: 'rational',
    name: 'Rational Numbers',
    description: 'Numbers that can be expressed as a ratio of two integers'
  },
   {
    id: 'integer',
    name: 'Integers',
    description: 'Whole numbers and their negatives (...-2, -1, 0, 1, 2...)'
  },
  {
    id: 'whole',
    name: 'Whole Numbers',
    description: 'Non-negative integers (0, 1, 2, 3, ...)'
  },
  {
    id: 'natural',
    name: 'Natural Numbers',
    description: 'Positive integers (1, 2, 3, ...)'
  }
]; 