import { classifyForm, buildConstraintMap, QuestionCategory } from './services/constraintEngine.ts';
import { QuestionType, FormQuestion } from './types.ts';

const questions: FormQuestion[] = [
    {
        id: "q_test",
        entryId: "entry.0",
        title: "TEST CHECKBOX",
        type: QuestionType.CHECKBOXES,
        options: [{ value: "Option 1" }, { value: "Option 2" }, { value: "Option 3" }],
        required: true,
    },
    {
        id: "q_age",
        entryId: "entry.1",
        title: "1. Age Group",
        type: QuestionType.MULTIPLE_CHOICE,
        options: [{ value: "18-24" }, { value: "25-34" }, { value: "35-44" }, { value: "45-54" }],
        required: true,
    },
    {
        id: "q_gender",
        entryId: "entry.2",
        title: "2. Gender",
        type: QuestionType.MULTIPLE_CHOICE,
        options: [{ value: "Male" }, { value: "Female" }, { value: "Other" }],
        required: true,
    },
    {
        id: "q_emp",
        entryId: "entry.3",
        title: "3. Employment Statu email",
        type: QuestionType.MULTIPLE_CHOICE,
        options: [{ value: "Student" }, { value: "Employed part-time" }, { value: "Unemployed" }],
        required: true,
    }
];

const classified = classifyForm(questions);
console.log(JSON.stringify(classified, null, 2));

const rules = buildConstraintMap(questions);
console.log('Rules generated:', rules.length);
console.log(JSON.stringify(rules, null, 2));
