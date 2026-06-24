package com.lu.admin.common.config;

import com.lu.admin.modules.client.grpc.ClientMonitorGrpcService;
import io.grpc.Server;
import io.grpc.netty.shaded.io.grpc.netty.NettyServerBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

@Component
public class GrpcServerLifecycle implements CommandLineRunner, DisposableBean {

    private static final Logger log = LoggerFactory.getLogger(GrpcServerLifecycle.class);

    private final GrpcServerProperties properties;
    private final ClientMonitorGrpcService clientMonitorGrpcService;
    private Server server;

    public GrpcServerLifecycle(
            GrpcServerProperties properties,
            ClientMonitorGrpcService clientMonitorGrpcService
    ) {
        this.properties = properties;
        this.clientMonitorGrpcService = clientMonitorGrpcService;
    }

    @Override
    public void run(String... args) throws IOException {
        if (!properties.isEnabled()) {
            log.info("gRPC server disabled");
            return;
        }
        server = NettyServerBuilder
                .forPort(properties.getPort())
                .addService(clientMonitorGrpcService)
                .build()
                .start();
        log.info("gRPC server started on port {}", properties.getPort());
    }

    @Override
    public void destroy() throws Exception {
        if (server == null) {
            return;
        }
        server.shutdown();
        if (!server.awaitTermination(10, TimeUnit.SECONDS)) {
            server.shutdownNow();
        }
        log.info("gRPC server stopped");
    }
}
