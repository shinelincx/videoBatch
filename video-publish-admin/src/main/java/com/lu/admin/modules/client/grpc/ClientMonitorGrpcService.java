package com.lu.admin.modules.client.grpc;

import com.google.protobuf.DescriptorProtos;
import com.google.protobuf.Descriptors;
import com.google.protobuf.DynamicMessage;
import com.lu.admin.modules.baseconfig.entity.Robot;
import com.lu.admin.modules.baseconfig.service.RobotService;
import com.lu.admin.modules.client.service.ClientCommandPushService;
import io.grpc.BindableService;
import io.grpc.MethodDescriptor;
import io.grpc.ServerServiceDefinition;
import io.grpc.Status;
import io.grpc.protobuf.ProtoUtils;
import io.grpc.stub.ServerCallStreamObserver;
import io.grpc.stub.ServerCalls;
import io.grpc.stub.StreamObserver;
import org.springframework.stereotype.Service;
import org.springframework.util.ObjectUtils;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Map;

@Service
public class ClientMonitorGrpcService implements BindableService {

    private static final String SERVICE_NAME = "video.publish.client.ClientMonitorService";

    private static final Descriptors.FileDescriptor FILE_DESCRIPTOR = buildFileDescriptor();
    private static final Descriptors.Descriptor HEARTBEAT_REQUEST = messageDescriptor("ClientHeartbeatRequest");
    private static final Descriptors.Descriptor HEARTBEAT_RESPONSE = messageDescriptor("ClientHeartbeatResponse");
    private static final Descriptors.Descriptor OFFLINE_REQUEST = messageDescriptor("ClientOfflineRequest");
    private static final Descriptors.Descriptor COMMAND_POLL_REQUEST = messageDescriptor("ClientCommandPollRequest");
    private static final Descriptors.Descriptor COMMAND_RESPONSE = messageDescriptor("ClientCommandResponse");
    private static final Descriptors.Descriptor ACK = messageDescriptor("ClientAck");

    private static final MethodDescriptor<DynamicMessage, DynamicMessage> REGISTER_METHOD =
            unaryMethod("Register", HEARTBEAT_REQUEST, HEARTBEAT_RESPONSE);
    private static final MethodDescriptor<DynamicMessage, DynamicMessage> HEARTBEAT_METHOD =
            unaryMethod("Heartbeat", HEARTBEAT_REQUEST, HEARTBEAT_RESPONSE);
    private static final MethodDescriptor<DynamicMessage, DynamicMessage> OFFLINE_METHOD =
            unaryMethod("Offline", OFFLINE_REQUEST, ACK);
    private static final MethodDescriptor<DynamicMessage, DynamicMessage> POLL_COMMAND_METHOD =
            unaryMethod("PollCommand", COMMAND_POLL_REQUEST, COMMAND_RESPONSE);
    private static final MethodDescriptor<DynamicMessage, DynamicMessage> SUBSCRIBE_COMMAND_METHOD =
            serverStreamingMethod("SubscribeCommand", COMMAND_POLL_REQUEST, COMMAND_RESPONSE);

    private final RobotService robotService;
    private final ClientCommandPushService commandPushService;

    public ClientMonitorGrpcService(RobotService robotService, ClientCommandPushService commandPushService) {
        this.robotService = robotService;
        this.commandPushService = commandPushService;
    }

    @Override
    public ServerServiceDefinition bindService() {
        return ServerServiceDefinition.builder(SERVICE_NAME)
                .addMethod(REGISTER_METHOD, ServerCalls.asyncUnaryCall(this::register))
                .addMethod(HEARTBEAT_METHOD, ServerCalls.asyncUnaryCall(this::heartbeat))
                .addMethod(OFFLINE_METHOD, ServerCalls.asyncUnaryCall(this::offline))
                .addMethod(POLL_COMMAND_METHOD, ServerCalls.asyncUnaryCall(this::pollCommand))
                .addMethod(SUBSCRIBE_COMMAND_METHOD, ServerCalls.asyncServerStreamingCall(this::subscribeCommand))
                .build();
    }

    private void register(DynamicMessage request, StreamObserver<DynamicMessage> responseObserver) {
        heartbeat(request, responseObserver);
    }

    private void heartbeat(DynamicMessage request, StreamObserver<DynamicMessage> responseObserver) {
        try {
            Robot robot = robotService.heartbeat(toRobot(request), tenantId(longField(request, "tenant_id")));
            responseObserver.onNext(DynamicMessage.newBuilder(HEARTBEAT_RESPONSE)
                    .setField(field(HEARTBEAT_RESPONSE, "robot_id"), robot.getId() == null ? 0L : robot.getId())
                    .setField(field(HEARTBEAT_RESPONSE, "machine_name"), value(robot.getMachineName()))
                    .setField(field(HEARTBEAT_RESPONSE, "status"), value(robot.getStatus()))
                    .setField(field(HEARTBEAT_RESPONSE, "server_time_millis"), System.currentTimeMillis())
                    .build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            responseObserver.onError(invalidArgument(e));
        }
    }

    private void offline(DynamicMessage request, StreamObserver<DynamicMessage> responseObserver) {
        try {
            Robot robot = new Robot()
                    .setMachineName(stringField(request, "machine_name"))
                    .setMacAddress(stringField(request, "mac_address"))
                    .setStatus(RobotService.STATUS_OFFLINE);
            robotService.heartbeat(robot, tenantId(longField(request, "tenant_id")));
            responseObserver.onNext(DynamicMessage.newBuilder(ACK)
                    .setField(field(ACK, "success"), true)
                    .build());
            responseObserver.onCompleted();
        } catch (Exception e) {
            responseObserver.onError(invalidArgument(e));
        }
    }

    private void pollCommand(DynamicMessage request, StreamObserver<DynamicMessage> responseObserver) {
        try {
            Robot robot = new Robot()
                    .setMachineName(stringField(request, "machine_name"))
                    .setMacAddress(stringField(request, "mac_address"));
            Map<String, Object> result = robotService.pollCommand(robot, tenantId(longField(request, "tenant_id")));
            responseObserver.onNext(commandResponse(result));
            responseObserver.onCompleted();
        } catch (Exception e) {
            responseObserver.onError(invalidArgument(e));
        }
    }

    private void subscribeCommand(DynamicMessage request, StreamObserver<DynamicMessage> responseObserver) {
        try {
            Robot robot = new Robot()
                    .setMachineName(stringField(request, "machine_name"))
                    .setMacAddress(stringField(request, "mac_address"));
            Long tenantId = tenantId(longField(request, "tenant_id"));
            Robot registered = robotService.register(robot, tenantId);
            ClientCommandPushService.Subscription subscription = commandPushService.subscribe(
                    registered.getId(),
                    command -> responseObserver.onNext(commandResponse(command))
            );
            if (responseObserver instanceof ServerCallStreamObserver) {
                ((ServerCallStreamObserver<DynamicMessage>) responseObserver).setOnCancelHandler(subscription::unsubscribe);
            }
            Map<String, Object> pendingCommand = robotService.pollCommand(robot, tenantId);
            if (!pendingCommand.isEmpty()) {
                responseObserver.onNext(commandResponse(pendingCommand));
            }
        } catch (Exception e) {
            responseObserver.onError(invalidArgument(e));
        }
    }

    private Robot toRobot(DynamicMessage request) {
        String status = stringField(request, "status");
        return new Robot()
                .setMachineName(stringField(request, "machine_name"))
                .setMacAddress(stringField(request, "mac_address"))
                .setStatus(ObjectUtils.isEmpty(status) ? RobotService.STATUS_STANDBY : status);
    }

    private static Descriptors.FileDescriptor buildFileDescriptor() {
        DescriptorProtos.FileDescriptorProto proto = DescriptorProtos.FileDescriptorProto.newBuilder()
                .setName("client_monitor.proto")
                .setPackage("video.publish.client")
                .setSyntax("proto3")
                .addMessageType(message("ClientHeartbeatRequest")
                        .addField(field("machine_name", 1, DescriptorProtos.FieldDescriptorProto.Type.TYPE_STRING))
                        .addField(field("mac_address", 2, DescriptorProtos.FieldDescriptorProto.Type.TYPE_STRING))
                        .addField(field("status", 3, DescriptorProtos.FieldDescriptorProto.Type.TYPE_STRING))
                        .addField(field("tenant_id", 4, DescriptorProtos.FieldDescriptorProto.Type.TYPE_INT64))
                        .addField(field("client_version", 5, DescriptorProtos.FieldDescriptorProto.Type.TYPE_STRING)))
                .addMessageType(message("ClientHeartbeatResponse")
                        .addField(field("robot_id", 1, DescriptorProtos.FieldDescriptorProto.Type.TYPE_INT64))
                        .addField(field("machine_name", 2, DescriptorProtos.FieldDescriptorProto.Type.TYPE_STRING))
                        .addField(field("status", 3, DescriptorProtos.FieldDescriptorProto.Type.TYPE_STRING))
                        .addField(field("server_time_millis", 4, DescriptorProtos.FieldDescriptorProto.Type.TYPE_INT64)))
                .addMessageType(message("ClientOfflineRequest")
                        .addField(field("machine_name", 1, DescriptorProtos.FieldDescriptorProto.Type.TYPE_STRING))
                        .addField(field("mac_address", 2, DescriptorProtos.FieldDescriptorProto.Type.TYPE_STRING))
                        .addField(field("tenant_id", 3, DescriptorProtos.FieldDescriptorProto.Type.TYPE_INT64)))
                .addMessageType(message("ClientCommandPollRequest")
                        .addField(field("machine_name", 1, DescriptorProtos.FieldDescriptorProto.Type.TYPE_STRING))
                        .addField(field("mac_address", 2, DescriptorProtos.FieldDescriptorProto.Type.TYPE_STRING))
                        .addField(field("tenant_id", 3, DescriptorProtos.FieldDescriptorProto.Type.TYPE_INT64)))
                .addMessageType(message("ClientCommandResponse")
                        .addField(field("robot_id", 1, DescriptorProtos.FieldDescriptorProto.Type.TYPE_INT64))
                        .addField(field("command", 2, DescriptorProtos.FieldDescriptorProto.Type.TYPE_STRING))
                        .addField(field("command_time_millis", 3, DescriptorProtos.FieldDescriptorProto.Type.TYPE_INT64))
                        .addField(field("payload", 4, DescriptorProtos.FieldDescriptorProto.Type.TYPE_STRING)))
                .addMessageType(message("ClientAck")
                        .addField(field("success", 1, DescriptorProtos.FieldDescriptorProto.Type.TYPE_BOOL))
                        .addField(field("message", 2, DescriptorProtos.FieldDescriptorProto.Type.TYPE_STRING)))
                .addService(DescriptorProtos.ServiceDescriptorProto.newBuilder()
                        .setName("ClientMonitorService")
                        .addMethod(method("Register", "ClientHeartbeatRequest", "ClientHeartbeatResponse"))
                        .addMethod(method("Heartbeat", "ClientHeartbeatRequest", "ClientHeartbeatResponse"))
                        .addMethod(method("Offline", "ClientOfflineRequest", "ClientAck"))
                        .addMethod(method("PollCommand", "ClientCommandPollRequest", "ClientCommandResponse"))
                        .addMethod(method("SubscribeCommand", "ClientCommandPollRequest", "ClientCommandResponse")))
                .build();
        try {
            return Descriptors.FileDescriptor.buildFrom(proto, new Descriptors.FileDescriptor[0]);
        } catch (Descriptors.DescriptorValidationException e) {
            throw new IllegalStateException("Invalid gRPC client monitor descriptor", e);
        }
    }

    private static DescriptorProtos.DescriptorProto.Builder message(String name) {
        return DescriptorProtos.DescriptorProto.newBuilder().setName(name);
    }

    private static DescriptorProtos.FieldDescriptorProto field(
            String name,
            int number,
            DescriptorProtos.FieldDescriptorProto.Type type
    ) {
        return DescriptorProtos.FieldDescriptorProto.newBuilder()
                .setName(name)
                .setNumber(number)
                .setType(type)
                .build();
    }

    private static DescriptorProtos.MethodDescriptorProto method(String name, String inputType, String outputType) {
        return DescriptorProtos.MethodDescriptorProto.newBuilder()
                .setName(name)
                .setInputType(".video.publish.client." + inputType)
                .setOutputType(".video.publish.client." + outputType)
                .build();
    }

    private static Descriptors.Descriptor messageDescriptor(String name) {
        Descriptors.Descriptor descriptor = FILE_DESCRIPTOR.findMessageTypeByName(name);
        if (descriptor == null) {
            throw new IllegalStateException("Missing gRPC message descriptor: " + name);
        }
        return descriptor;
    }

    private static MethodDescriptor<DynamicMessage, DynamicMessage> unaryMethod(
            String methodName,
            Descriptors.Descriptor requestDescriptor,
            Descriptors.Descriptor responseDescriptor
    ) {
        return method(methodName, MethodDescriptor.MethodType.UNARY, requestDescriptor, responseDescriptor);
    }

    private static MethodDescriptor<DynamicMessage, DynamicMessage> serverStreamingMethod(
            String methodName,
            Descriptors.Descriptor requestDescriptor,
            Descriptors.Descriptor responseDescriptor
    ) {
        return method(methodName, MethodDescriptor.MethodType.SERVER_STREAMING, requestDescriptor, responseDescriptor);
    }

    private static MethodDescriptor<DynamicMessage, DynamicMessage> method(
            String methodName,
            MethodDescriptor.MethodType methodType,
            Descriptors.Descriptor requestDescriptor,
            Descriptors.Descriptor responseDescriptor
    ) {
        return MethodDescriptor.<DynamicMessage, DynamicMessage>newBuilder()
                .setType(methodType)
                .setFullMethodName(MethodDescriptor.generateFullMethodName(SERVICE_NAME, methodName))
                .setRequestMarshaller(ProtoUtils.marshaller(DynamicMessage.getDefaultInstance(requestDescriptor)))
                .setResponseMarshaller(ProtoUtils.marshaller(DynamicMessage.getDefaultInstance(responseDescriptor)))
                .build();
    }

    private DynamicMessage commandResponse(Map<String, Object> result) {
        return DynamicMessage.newBuilder(COMMAND_RESPONSE)
                .setField(field(COMMAND_RESPONSE, "robot_id"), longValue(result.get("robotId")))
                .setField(field(COMMAND_RESPONSE, "command"), value(result.get("command")))
                .setField(field(COMMAND_RESPONSE, "command_time_millis"), timeMillis(result.get("commandTime")))
                .setField(field(COMMAND_RESPONSE, "payload"), value(result.get("payload")))
                .build();
    }

    private static Descriptors.FieldDescriptor field(Descriptors.Descriptor descriptor, String fieldName) {
        Descriptors.FieldDescriptor field = descriptor.findFieldByName(fieldName);
        if (field == null) {
            throw new IllegalStateException("Missing gRPC field descriptor: " + descriptor.getName() + "." + fieldName);
        }
        return field;
    }

    private String stringField(DynamicMessage message, String fieldName) {
        Object value = message.getField(field(message.getDescriptorForType(), fieldName));
        return value == null ? "" : String.valueOf(value);
    }

    private long longField(DynamicMessage message, String fieldName) {
        return longValue(message.getField(field(message.getDescriptorForType(), fieldName)));
    }

    private Long tenantId(long tenantId) {
        return tenantId <= 0 ? null : tenantId;
    }

    private String value(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private long longValue(Object value) {
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        if (value == null) {
            return 0L;
        }
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (NumberFormatException ignored) {
            return 0L;
        }
    }

    private long timeMillis(Object value) {
        if (value instanceof LocalDateTime) {
            return ((LocalDateTime) value).atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
        }
        return 0L;
    }

    private RuntimeException invalidArgument(Exception e) {
        String message = e.getMessage();
        if (ObjectUtils.isEmpty(message)) {
            message = e.getClass().getSimpleName();
        }
        return Status.INVALID_ARGUMENT.withDescription(message).asRuntimeException();
    }
}
