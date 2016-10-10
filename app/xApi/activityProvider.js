define(['durandal/app',
    'durandal/system',
    './statementsQueue',
    './statementsQueueHandler',
    './configuration/settings',
    './entities/actor',
    './entities/activity',
    './entities/statement',
    './entities/result',
    './entities/score',
    './entities/contextActivities',
    './entities/interactionDefinition',
    './entities/languageMap',
    './verbs',
    './interactionTypes',
    './activityTypes',
    'eventManager',
    'constants',
    'queries/sectionQueries',
    'Q',
    'progressContext',
	'../entities/course'],
    function (app, system, statementsQueue, statementsQueueHandler, settingsModule, ActorModel, ActivityModel, StatementModel, ResultModel, ScoreModel, ContextActivitiesModel, InteractionDefinitionModel, LanguageMapModel, verbs, interactionTypes, activityTypes, eventManager, globalConstants, sectionQueries, Q, progressContext, courseContext) {
        "use strict";

        var subscriptions = [],
            rootCourseUrl = '';

        var activityProvider = {
            initialize: initialize,
            turnOffSubscriptions: turnOffSubscriptions,
            createActor: createActor,

            actor: null,
            activityName: '',
            activityUrl: '',
            courseId: null
        },
        sessionId = null;
        return activityProvider;

        function initialize(courseId, actorName, actorEmail, actorAccount, activityName, activityUrl, attemptId) {
            rootCourseUrl = activityUrl != undefined ? activityUrl.split("?")[0].split("#")[0] : '';
            sessionId = progressContext.get().attemptId;


            // TODO: Check if undefined activity url is possible
            activityProvider.actor = createActor(actorName, actorEmail, actorAccount);
            activityProvider.activityName = activityName;
            activityProvider.activityUrl = activityUrl;
            activityProvider.courseId = courseId;

            subscriptions.push(eventManager.subscribeForEvent(eventManager.events.courseStarted).then(courseStartedHandler));
            subscriptions.push(eventManager.subscribeForEvent(eventManager.events.questionAnswered).then(questionAnsweredHandler));
            subscriptions.push(eventManager.subscribeForEvent(eventManager.events.courseFinished).then(courseFinishedHandler));

            app.on('xapi:turnOff', turnOffSubscriptions);
        }

        function turnOffSubscriptions() {
            _.each(subscriptions, function (subscription) {
                subscription.off();
            });
        }

        function pushStatementIfSupported(statement) {
            var statementName = statement.verb.display[settingsModule.settings.defaultLanguage];
            if (_.contains(settingsModule.settings.xApi.allowedVerbs, statementName)) {
                statementsQueue.enqueue(statement);
            }
        }

        function createActor(name, email, account) {
            var actor = new ActorModel({
                name: name,
                mbox: 'mailto:' + email,
                account: account
            });

            return actor;
        }

        function createActivity(id, name, type) {
            var displayName = {};
            displayName[settingsModule.settings.defaultLanguage] = name;

            var activity = new ActivityModel({
                id: id,
                definition: { name: displayName }
            });
            if (typeof type != typeof undefined) {
                activity.definition.type = type;
            }

            return activity;
        }

        function createContext(contextSpec) {
            contextSpec = contextSpec || {};
            var contextExtensions = contextSpec.extensions || {};
            contextExtensions["http://easygenerator/expapi/course/id"] = activityProvider.courseId;
            contextSpec.extensions = contextExtensions;
            contextSpec.registration = sessionId;
            return contextSpec;
        }

        function createStatement(verb, result, activity, context) {
            var activityData = activity || createActivity(activityProvider.activityUrl, activityProvider.activityName);
            context = context || createContext();

            var statement = new StatementModel({
                actor: activityProvider.actor,
                verb: verb,
                object: activityData,
                result: result,
                context: context
            });

            return statement;
        }

        function courseStartedHandler() {
            pushStatementIfSupported(createStatement(verbs.started));
        }

        function courseFinishedHandler(course) {
            if (_.isUndefined(course)) {
                throw 'Request failed: Not enough data in the settings';
            }

            if (_.isArray(course.sections)) {
                _.each(course.sections, function (section) {
                    var sectionUrl = rootCourseUrl + '#sections?section_id=' + section.id;

                    var resultData = {
                        score: new ScoreModel(section.score() / 100)
                    };

                    var statement = createStatement(verbs.mastered, new ResultModel(resultData), createActivity(sectionUrl, section.title));
                    pushStatementIfSupported(statement);
                });
            }

            var courseResultData = {
                score: new ScoreModel(course.score() / 100)
            };
            var courseResult = new ResultModel(courseResultData);
            var resultVerb = course.isSuccessful() ? settingsModule.settings.scoresDistribution.positiveVerb : verbs.failed;

            pushStatementIfSupported(createStatement(resultVerb, courseResult));
            pushStatementIfSupported(createStatement(verbs.stopped));

            var dfd = Q.defer();

            statementsQueue.statements.subscribe(function (newValue) {
                if (newValue.length == 0) {
                    dfd.resolve();
                }
            });

            // (^\ x_x /^)
            statementsQueue.enqueue(undefined);

            return dfd.promise;
        }

        function courseProgressedHandler(course) {
            if (_.isUndefined(course)) {
                throw 'Request failed: Not enough data in the settings';
            }
            
            var courseResultData = {
                score: new ScoreModel(course.score() / 100)
            };
            var courseResult = new ResultModel(courseResultData);

            pushStatementIfSupported(createStatement(verbs.progressed, courseResult, createActivity(activityProvider.activityUrl, activityProvider.activityName, activityTypes.course)));
        }

        function sectionProgressedHandler(section) {
            if (_.isUndefined(section)) {
                throw 'Request failed: Not enough data in the settings';
            }

			var sectionUrl = rootCourseUrl + '#sections?section_id=' + section.id;
            var resultData = {
                score: new ScoreModel(section.score() / 100)
            };
            var statement = createStatement(verbs.progressed, new ResultModel(resultData), createActivity(sectionUrl, section.title, activityTypes.objective));
            pushStatementIfSupported(statement);
        }

        function questionAnsweredHandler(data, preventSendingParentProgress) {
            if (_.isUndefined(data)) {
                throw 'Request failed: Not enough data in the settings';
            }

            var section = sectionQueries.getByQuestionId(data.question.id);
            if (_.isUndefined(section)) {
                throw 'Section is not found';
            }

            var parts = getQuestionParts(data, section);

            var parentUrl = rootCourseUrl + '#sections?section_id=' + section.id;
            
            var contextObj = {};
            contextObj.contextActivities = new ContextActivitiesModel({
                parent: [createActivity(parentUrl, section.title)]
            });
            contextObj.extensions = {};
            contextObj.extensions["http://easygenerator/expapi/question/survey"] = data.question.hasOwnProperty('isSurvey') && data.question.isSurvey;
            contextObj.extensions["http://easygenerator/expapi/question/type"] = data.question.type;

            var context = createContext(contextObj);

            if (parts) {
                var statement = createStatement(verbs.answered, parts.result, parts.object, context);
                if (statement) {
                    pushStatementIfSupported(statement);
                    if (!preventSendingParentProgress) {
                        sectionProgressedHandler(section);
                        courseProgressedHandler(courseContext);
                    }
                }
            }

        }

        function getQuestionParts(data, section) {
            switch (data.question.type) {
                case globalConstants.questionTypes.multipleSelect:
                case globalConstants.questionTypes.singleSelectText:
                    return getSelectTextQuestionActivityAndResult(data.question, data.answer, section);
                case globalConstants.questionTypes.fillInTheBlank:
                    return getFillInQuestionActivityAndResult(data.question, data.answer, section);
                case globalConstants.questionTypes.singleSelectImage:
                    return getSingleSelectImageQuestionAcitivityAndResult(data.question, data.answer, section);
                case globalConstants.questionTypes.statement:
                    return getStatementQuestionActivityAndResult(data.question, data.answer, section);
                case globalConstants.questionTypes.dragAndDrop:
                    return getDragAndDropTextQuestionActivityAndResult(data.question, data.answer, section);
                case globalConstants.questionTypes.textMatching:
                    return getMatchingQuestionActivityAndResult(data.question, data.answer, section);
                case globalConstants.questionTypes.hotspot:
                    return getHotSpotQuestionActivityAndResult(data.question, data.answer, section);
                case globalConstants.questionTypes.scenario:
                    return getScenarioQuestionActivityAndResult(data.question, section);
                case globalConstants.questionTypes.rankingText:
                    return getRankingTextQuestionActivityAndResult(data.question, data.answer, section);
            }

            return null;
        }

        function getSelectTextQuestionActivityAndResult(question, answer, section) {
            return {
                result: new ResultModel({
                    score: new ScoreModel(question.score / 100),
                    response: answer.join("[,]")
                }),
                object: new ActivityModel({
                    id: rootCourseUrl + '#section/' + section.id + '/question/' + question.id,
                    definition: new InteractionDefinitionModel({
                        name: new LanguageMapModel(question.title),
                        interactionType: interactionTypes.choice,
                        correctResponsesPattern: !!question.isSurvey ? [] : [
                            _.chain(question.answers)
                            .filter(function (item) {
                                return item.isCorrect;
                            })
                            .map(function (item) {
                                return item.id;
                            }).value().join("[,]")
                        ],
                        choices: _.map(question.answers, function (item) {
                            return {
                                id: item.id,
                                description: new LanguageMapModel(item.text)
                            };
                        })
                    })
                })
            };
        }

        function getStatementQuestionActivityAndResult(question, answer, section) {
            return {
                result: new ResultModel({
                    score: new ScoreModel(question.score / 100),
                    response: _.chain(answer).filter(function (statement) {
                        return !_.isNull(statement.state) && !_.isUndefined(statement.state);
                    }).map(function (statement) {
                        return statement.id + '[.]' + statement.state;
                    }).value().join("[,]")
                }),
                object: new ActivityModel({
                    id: rootCourseUrl + '#section/' + section.id + '/question/' + question.id,
                    definition: new InteractionDefinitionModel({
                        name: new LanguageMapModel(question.title),
                        interactionType: interactionTypes.choice,
                        correctResponsesPattern: !!question.isSurvey ? [] : [
                            _.map(question.answers, function (item) {
                                return item.id + '[.]' + item.isCorrect;
                            }).join("[,]")
                        ],
                        choices: _.map(question.answers, function (item) {
                            return {
                                id: item.id,
                                description: new LanguageMapModel(item.text)
                            };
                        })
                    })
                })
            };
        }

        function getSingleSelectImageQuestionAcitivityAndResult(question, answer, section) {

            return {
                result: new ResultModel({
                    score: new ScoreModel(question.score / 100),
                    response: answer.toString()
                }),
                object: new ActivityModel({
                    id: rootCourseUrl + '#section/' + section.id + '/question/' + question.id,
                    definition: new InteractionDefinitionModel({
                        name: new LanguageMapModel(question.title),
                        interactionType: interactionTypes.choice,
                        correctResponsesPattern: [question.correctAnswerId.toString()],
                        choices: _.map(question.answers, function (item) {
                            return {
                                id: item.id,
                                description: new LanguageMapModel(item.image)
                            };
                        })
                    })
                })
            };

        }

        function getFillInQuestionActivityAndResult(question, answer, section) {
            return {
                result: new ResultModel({
                    score: new ScoreModel(question.score / 100),
                    response: _.map(answer, function (item) {
                        return item.text;
                    }).join("[,]")
                }),
                object: new ActivityModel({
                    id: rootCourseUrl + '#section/' + section.id + '/question/' + question.id,
                    definition: new InteractionDefinitionModel({
                        name: new LanguageMapModel(question.title),
                        interactionType: interactionTypes.fillIn,
                        correctResponsesPattern: [
                            _.flatten(_.map(question.answers, function (item) {
                                return item.text;
                            })).join("[,]")
                        ]
                    })
                })
            };
        }

        function getHotSpotQuestionActivityAndResult(question, answer, section) {
            return {
                result: new ResultModel({
                    score: new ScoreModel(question.score / 100),
                    response: _.map(answer, function (mark) {
                        return '(' + mark.x + ',' + mark.y + ')';
                    }).join("[,]")
                }),
                object: new ActivityModel({
                    id: rootCourseUrl + '#section/' + section.id + '/question/' + question.id,
                    definition: new InteractionDefinitionModel({
                        name: new LanguageMapModel(question.title),
                        interactionType: interactionTypes.other,
                        correctResponsesPattern: [_.map(question.spots, function (spot) {
                            var polygonCoordinates = _.map(spot, function (spotCoordinates) {
                                return '(' + spotCoordinates.x + ',' + spotCoordinates.y + ')';
                            });
                            return polygonCoordinates.join("[.]");
                        }).join("[,]")]
                    })
                })
            }
        }

        function getDragAndDropTextQuestionActivityAndResult(question, answer, section) {
            return {
                result: new ResultModel({
                    score: new ScoreModel(question.score / 100),
                    response: _.map(answer, function (item) {
                        return '(' + item.x + ',' + item.y + ')';
                    }).join("[,]")
                }),

                object: new ActivityModel({
                    id: rootCourseUrl + '#section/' + section.id + '/question/' + question.id,
                    definition: new InteractionDefinitionModel({
                        name: new LanguageMapModel(question.title),
                        interactionType: interactionTypes.other,
                        correctResponsesPattern: [_.map(question.dropspots, function (item) {
                            return '(' + item.x + ',' + item.y + ')';
                        }).join("[,]")]
                    })
                })
            }
        }

        function getMatchingQuestionActivityAndResult(question, answer, section) {
            var formattedAnswer = _.map(question.answers, function (pair) {
                var answerPair = _.find(answer, function (a) {
                    return a.id === pair.id;
                });

                return { key: pair.key, value: answerPair && answerPair.value ? answerPair.value : '' };
            });

            return {
                result: new ResultModel({
                    score: new ScoreModel(question.score / 100),
                    response: _.map(formattedAnswer, function (item) {
                        return item.key.toLowerCase() + "[.]" + item.value.toLowerCase();
                    }).join("[,]")
                }),
                object: new ActivityModel({
                    id: rootCourseUrl + '#section/' + section.id + '/question/' + question.id,
                    definition: new InteractionDefinitionModel({
                        name: new LanguageMapModel(question.title),
                        interactionType: interactionTypes.matching,
                        correctResponsesPattern: [_.map(question.answers, function (item) {
                            return item.key.toLowerCase() + "[.]" + item.value.toLowerCase();
                        }).join("[,]")],
                        source: _.map(question.answers, function (item) {
                            return { id: item.key.toLowerCase(), description: new LanguageMapModel(item.key) }
                        }),
                        target: _.map(question.answers, function (item) {
                            return { id: item.value.toLowerCase(), description: new LanguageMapModel(item.value) }
                        })
                    })
                })
            };

        }

        function getScenarioQuestionActivityAndResult(question, section) {
            return {
                result: new ResultModel({
                    score: new ScoreModel(question.score / 100)
                }),
                object: new ActivityModel({
                    id: rootCourseUrl + '#section/' + section.id+ '/question/' + question.id,
                    definition: new InteractionDefinitionModel({
                        name: new LanguageMapModel(question.title),
                        interactionType: interactionTypes.other
                    })
                })
            };
        }

        function getRankingTextQuestionActivityAndResult(question, answer, section) {
            return {
                result: new ResultModel({
                    score: new ScoreModel(question.score / 100),
                    response: _.map(question.answer, function (item) {
                        return item.text.toLowerCase();
                    }).join("[,]")
                }),
                object: new ActivityModel({
                    id: rootCourseUrl + '#section/' + section.id + '/question/' + question.id,
                    definition: new InteractionDefinitionModel({
                        name: new LanguageMapModel(question.title),
                        interactionType: interactionTypes.sequencing,
                        correctResponsesPattern: [_.map(question.correctOrder, function (item) {
                            return item.text.toLowerCase();
                        }).join("[,]")],
                        choices: _.map(question.rankingItems, function (item) {
                            return { id: item.text.toLowerCase(), description: new LanguageMapModel(item.text) }
                        })
                    })
                })
            };

        }
    }
);