define(['entities/course',
    'entities/Section',
    'entities/Multipleselect',
    'entities/FillInTheBlanks',
    'entities/DragAndDrop',
    'entities/Singleselect',
    'entities/SingleselectImage',
    'entities/TextMatching',
    'entities/Statement',
    'entities/Hotspot',
    'entities/ScenarioQuestion',
    'entities/RankingText',
    'constants',

     'Q',
     '_',
     'plugins/http'],

     function (course, Section, Multipleselect, FillInTheBlanks, DragAndDrop, Singleselect, SingleselectImage,
         TextMatching, Statement, Hotspot, ScenarioQuestion, RankingText, constants, Q, _, http) {
         'use strict';

         return {
             initialize: initialize
         };

         function initialize() {
             var dfd = Q.defer();

             $.ajax({
                 url: 'content/data.js',
                 contentType: 'application/json',
                 dataType: 'json',
                 cache: false
             }).done(function (response) {
                 var promises = [];

                 course.id = response.id;
                 course.templateId = response.templateId,
                 course.title = response.title;
                 course.createdOn = new Date(response.createdOn);

                 _.each(response.sections, function (dobj) {
                     var section = new Section(dobj.id, dobj.title);

                     _.each(dobj.questions, function (dq) {
                         var question;
                         switch (dq.type) {
                             case constants.questionTypes.multipleSelect:
                                 question = new Multipleselect(dq.id, dq.title, dq.type, dq.isSurvey, dq.answers);
                                 break;
                             case constants.questionTypes.fillInTheBlank:
                                 var answers = [];
                                 _.each(dq.answerGroups, function (group) {
                                     _.each(group.answers, function (answer) {
                                         if (answer.isCorrect) {
                                             answers.push({
                                                 id: answer.id,
                                                 groupId: group.id,
                                                 text: answer.text,
                                                 matchCase: answer.matchCase
                                             });
                                         }
                                     });
                                 });
                                 question = new FillInTheBlanks(dq.id, dq.title, dq.type, answers);
                                 break;
                             case constants.questionTypes.dragAndDrop:
                                 question = new DragAndDrop(dq.id, dq.title, dq.type, dq.background, dq.dropspots);
                                 break;
                             case constants.questionTypes.singleSelectText:
                                 question = new Singleselect(dq.id, dq.title, dq.type, dq.isSurvey, dq.answers);
                                 break;
                             case constants.questionTypes.singleSelectImage:
                                 question = new SingleselectImage(dq.id, dq.title, dq.type, dq.answers, dq.correctAnswerId);
                                 break;
                             case constants.questionTypes.textMatching:
                                 question = new TextMatching(dq.id, dq.title, dq.type, dq.answers, dq.correctAnswerId);
                                 break;
                             case constants.questionTypes.statement:
                                 question = new Statement(dq.id, dq.title, dq.type, dq.isSurvey, dq.answers);
                                 break;
                             case constants.questionTypes.hotspot:
                                 question = new Hotspot(dq.id, dq.title, dq.type, dq.isMultiple, dq.background, dq.spots);
                                 break;
                             case constants.questionTypes.scenario:
                                 question = new ScenarioQuestion(dq.id, dq.title, dq.type, dq.projectId, dq.embedCode, dq.masteryScore);
                                 break;
                             case constants.questionTypes.rankingText:
                                 question = new RankingText(dq.id, dq.title, dq.type, dq.answers);
                                 break;
                             default:
                                 return undefined;
                         }

                         if (dq.hasContent) {
                             promises.push(http.get('content/' + dobj.id + '/' + dq.id + '/content.html', { dataType: 'html' }).then(function (content) {
                                 question.content = content;
                             }));
                         }

                         if (dq.hasCorrectFeedback) {
                             question.correctFeedback = 'content/' + dobj.id + '/' + dq.id + '/correctFeedback.html';
                         }

                         if (dq.hasIncorrectFeedback) {
                             question.incorrectFeedback = 'content/' + dobj.id + '/' + dq.id + '/incorrectFeedback.html';
                         }

                         question.learningContents = _.map(dq.learningContents, function (item) {
                             return 'content/' + dobj.id + '/' + dq.id + '/' + item.id + '.html';
                         });

                         section.questions.push(question);
                     });

                     if (section.questions && section.questions.length) {
                         course.sections.push(section);
                     }
                 });

                 if (response.hasIntroductionContent) {
                     promises.push(http.get('content/content.html', { dataType: 'html' }).then(function (content) {
                         course.content = content;
                     }));
                 }

                 Q.allSettled(promises).then(function () {
                     dfd.resolve();
                 })
                 ['catch'](function (reason) {
                     dfd.reject(reason);
                 });

             });

             return dfd.promise;
         }

     });